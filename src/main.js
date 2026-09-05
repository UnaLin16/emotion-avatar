import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

//  建立場景
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x222222)

//  建立相機
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 1.6, 7)
camera.lookAt(0, 2, 0)

//  建立渲染器
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

//  加燈光
const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)

const dirLight = new THREE.DirectionalLight(0xffffff, 2)
dirLight.position.set(2, 5, 5)
scene.add(dirLight)


// 三種情緒的Morph Target數值組合
// [Angry, Surprised, Sad]
const emotionMap = {
  '開心': [0, 0.3, 0],
  '難過': [0, 0,   1],
  '生氣': [1, 0,   0]
}


// 儲存Head節點，等模型載入後才能用
let headMeshes = []

// 切換表情的函式
window.setEmotion = function(emotion) {
  const values = emotionMap[emotion]
  headMeshes.forEach(function(mesh) {
    mesh.morphTargetInfluences[0] = values[0]  // Angry
    mesh.morphTargetInfluences[1] = values[1]  // Surprised
    mesh.morphTargetInfluences[2] = values[2]  // Sad
  })
}




//  載入3D角色
const loader = new GLTFLoader()
loader.load(
  'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
  function(gltf) {
    const model = gltf.scene
    scene.add(model)

   
    model.traverse(function(node) {
      if (node.isMesh && node.morphTargetDictionary) {
        headMeshes.push(node)
      }
    })

    // 預設顯示「開心」表情
    setEmotion('開心')
  },
  function(progress) {
    console.log('載入中...', (progress.loaded / progress.total * 100) + '%')
  },
  function(error) {
    console.log('載入失敗', error)
  }
)

// 視窗大小改變時自動調整
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})


// 6. 動畫迴圈
function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}

animate()

// 呼叫後端API判斷情緒
async function detectEmotion(text) {
  try {
    const response = await fetch('https://emotion-avatar-backend.onrender.com/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    })
    const data = await response.json()
    console.log('後端回傳：', data)
    return data.emotion
  } catch (error) {
    console.log('呼叫API失敗：', error)
  }
}

// 綁定送出按鈕
const sendBtn = document.getElementById('sendBtn')
const userInput = document.getElementById('userInput')
const status = document.getElementById('status')

sendBtn.addEventListener('click', async function() {
  const text = userInput.value
  if (text === '') {
    status.textContent = '請先輸入文字'
    return
  }

  // Loading狀態
  sendBtn.disabled = true
  status.textContent = '分析中...'

  const emotion = await detectEmotion(text)

  if (emotion) {
    setEmotion(emotion)
    status.textContent = `偵測到情緒：${emotion}`
  } else {
    status.textContent = '分析失敗，請確認後端是否啟動'
  }

  sendBtn.disabled = false
})

// 按Enter也能送出
userInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    sendBtn.click()
  }
})