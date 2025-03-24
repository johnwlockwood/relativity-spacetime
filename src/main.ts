import './style.css'
// Import Three.js as ES module
import * as THREE from 'three'
// import { Satellite } from './Satellite'

// Constants (real units, scaled for visualization)
const G = 6.6743e-11; // m³ kg⁻¹ s⁻²
const c = 299792458; // m/s
const earthRadius = 1; // Visual radius
// const baseMass = 5.972e24; // Earth's mass in kg

// Create a container for the Three.js canvas
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="three-container" id="three-container"></div>
  <div class="ui-container">
    <div class="slider-container">
      <label>Planet Mass (x10²⁴ kg):</label>
      <input type="range" id="massSlider" min="1" max="10" value="5.972" step="0.1">
      <span id="massValue">5.972</span>
    </div>
  </div>
`

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
  camera.position.set(5, 2, 8)
  camera.lookAt(0, 0, 0)

  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  container.appendChild(renderer.domElement)

  // Add lights
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(-5, 5, 3)
  scene.add(directionalLight)

  // Earth
  const earthGeometry = new THREE.SphereGeometry(earthRadius, 32, 32)
  const earthMaterial = new THREE.MeshPhongMaterial({
    color: 0x0066ff,
    transparent: true,
    opacity: 0.9,
    shininess: 30
  })
  const earth = new THREE.Mesh(earthGeometry, earthMaterial)
  scene.add(earth)

  // Spacetime grid
  const gridSize = 10
  const gridStep = 0.1
  // Create a proper 3D surface grid
  const gridGeometry = new THREE.PlaneGeometry(gridSize, gridSize, gridSize / gridStep, gridSize / gridStep)
  const gridMaterial = new THREE.MeshBasicMaterial({
    color: 0xdb7f23,
    wireframe: true,
    side: THREE.DoubleSide  // Make the grid visible from both sides
  })
  const grid = new THREE.Mesh(gridGeometry, gridMaterial)
  grid.rotation.x = -Math.PI / 2 // Rotate to make it horizontal (XZ plane)
  grid.position.y = -1.0 // Slightly below Earth
  scene.add(grid)

  // Update spacetime grid
  function updateGrid(mass: number) {
    const k = (mass * G) / (c * c) * 5e2 // Adjusted scaling for visibility
    const positions = gridGeometry.attributes.position.array as Float32Array
    const epsilon = 0.5 // Smoothing factor
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const z = positions[i + 1]
      const r = Math.sqrt(x * x + z * z)
      
      // Use a softened potential to avoid sharp spike at center
      positions[i + 2] = -k / (r + epsilon)
    }
    
    gridGeometry.attributes.position.needsUpdate = true
  }

  // Mass slider elements
  const massSlider = document.getElementById('massSlider') as HTMLInputElement
  const massValue = document.getElementById('massValue') as HTMLSpanElement
  
  // Initialize grid with default mass
  updateGrid(parseFloat(massSlider.value) * 1e24)
  
  massSlider.addEventListener('input', () => {
    const massVal = parseFloat(massSlider.value)
    massValue.textContent = massVal.toFixed(3)
    updateGrid(massVal * 1e24)
  })

  // Animation loop
  const animate = (): void => {
    requestAnimationFrame(animate)
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
