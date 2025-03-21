import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'
// Three.js types are provided by the src/types/three-cdn.d.ts file

// Create a container for the Three.js canvas and the original content
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <div class="three-container" id="three-container"></div>
    <div class="content">
      <a href="https://vite.dev" target="_blank">
        <img src="${viteLogo}" class="logo" alt="Vite logo" />
      </a>
      <a href="https://www.typescriptlang.org/" target="_blank">
        <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
      </a>
      <h1>Vite + TypeScript + Three.js</h1>
      <div class="card">
        <button id="counter" type="button"></button>
      </div>
      <p class="read-the-docs">
        Click on the Vite and TypeScript logos to learn more
      </p>
    </div>
  </div>
`

// Set up the counter
setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)

// Set up Three.js scene
const setupThreeScene = (): void => {
  const container = document.getElementById('three-container')
  if (!container) return

  // Create scene
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a1a)

  // Create camera
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  )
  camera.position.z = 5

  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  container.appendChild(renderer.domElement)

  // Create a cube
  const geometry = new THREE.BoxGeometry(2, 2, 2)
  const material = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    metalness: 0.3,
    roughness: 0.4,
  })
  const cube = new THREE.Mesh(geometry, material)
  scene.add(cube)

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(5, 5, 5)
  scene.add(directionalLight)

  // Animation loop
  const animate = (): void => {
    requestAnimationFrame(animate)

    // Rotate the cube
    cube.rotation.x += 0.01
    cube.rotation.y += 0.01

    renderer.render(scene, camera)
  }

  animate()

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  })
}

// Initialize Three.js scene
setupThreeScene()
