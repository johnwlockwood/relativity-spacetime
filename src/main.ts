import './style.css'
// Import Three.js as ES module
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// Import Earth model
import earthModelPath from './planet_earth/scene.gltf?url';
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
  scene.background = new THREE.Color("rgb(29, 34, 55)")

  // Create camera
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  )
  camera.position.set(-4, 2, 8)
  camera.lookAt(0, 0, 0)

  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  container.appendChild(renderer.domElement)

  // Add lights - enhanced for better Earth illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0) // Increased intensity and whiter light
  scene.add(ambientLight)

  // Main directional light (sun-like)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5) // Increased intensity
  directionalLight.position.set(-5, 5, 3)
  scene.add(directionalLight)

  // Add multiple point lights to highlight the Earth model from different angles
  const pointLight1 = new THREE.PointLight(0xffffff, 1.5, 100)
  pointLight1.position.set(2, 3, 4)
  scene.add(pointLight1)
  
  const pointLight2 = new THREE.PointLight(0xffffff, 1.0, 100)
  pointLight2.position.set(-3, 2, 5)
  scene.add(pointLight2)
  
  const pointLight3 = new THREE.PointLight(0xffffff, 1.0, 100)
  pointLight3.position.set(4, -2, 3)
  scene.add(pointLight3)
  
  // Add a spotlight specifically targeting the Earth
  const spotLight = new THREE.SpotLight(0xffffff, 2.0)
  spotLight.position.set(10, 10, 10)
  spotLight.angle = Math.PI / 6
  spotLight.penumbra = 0.2
  spotLight.decay = 1
  spotLight.distance = 50
  spotLight.target.position.set(0, 0, 0) // Target the center where Earth is
  scene.add(spotLight)
  scene.add(spotLight.target)

  // Earth - Load 3D model
  let earth: THREE.Object3D | null = null;
  const loader = new GLTFLoader();
  loader.load(
    earthModelPath,
    (gltf) => {
      earth = gltf.scene;
      // Scale the model appropriately - increase size for better visibility
      earth.scale.set(2, 2, 2);
      // Center the model
      earth.position.set(0, 0, 0);
      // Add the model to the scene
      scene.add(earth);
      
      // Apply materials to all meshes in the model for better appearance
      earth.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Enhance material properties
          if (child.material) {
            child.material.needsUpdate = true;
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                // Make material opaque
                mat.transparent = false;
                mat.opacity = 1.0;
                if (mat.shininess !== undefined) {
                  mat.shininess = 30;
                }
              });
            } else {
              // Make material opaque
              child.material.transparent = false;
              child.material.opacity = 1.0;
              if (child.material.shininess !== undefined) {
                child.material.shininess = 30;
              }
            }
          }
        }
      });
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
      console.error('An error happened loading the Earth model:', error);
      // Fallback to simple sphere if model fails to load
      const earthGeometry = new THREE.SphereGeometry(earthRadius, 32, 32);
      const earthMaterial = new THREE.MeshPhongMaterial({
        color: "rgb(92, 190, 239)",
        transparent: true,
        opacity: 0.99,
        shininess: 30
      });
      earth = new THREE.Mesh(earthGeometry, earthMaterial);
      scene.add(earth);
    }
  );

  // Spacetime grid
  const gridSize = 10
  const gridStep = 0.2
  // Create a proper 3D surface grid
  const gridGeometry = new THREE.PlaneGeometry(gridSize, gridSize, gridSize / gridStep, gridSize / gridStep)
  const gridMaterial = new THREE.MeshBasicMaterial({
    color: "rgb(0, 161, 140)",
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
    
    // Rotate the Earth model if it's loaded
    if (earth) {
      earth.rotation.y += 0.005; // Slow rotation around y-axis
    }
    
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
