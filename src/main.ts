import './style.css'
// Import Three.js as ES module
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// Import Earth model
import earthModelPath from './planet_earth/scene.gltf?url';
// Import Satellite model
import satelliteModelPath from './low_poly_satellite/scene.gltf?url';
// Import Satellite class
import { Satellite } from './Satellite'

// Constants (real units, scaled for visualization)
const G = 6.6743e-11; // m³ kg⁻¹ s⁻²
const c = 299792458; // m/s
const earthRadius = 2; // Visual radius
const satelliteRadius = 6; // Increased orbit radius to position satellites farther away
const numSatellites = 4;
const baseMass = 5.972e24; // Earth's mass in kg
const baseSatelliteSpeed = 3870; // m/s (GPS satellite speed)

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
  scene.background = new THREE.Color(0x1d2237) // Dark blue background
  
  // Create renderer
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true // Enable alpha
  })
  renderer.setClearColor(0x1d2237, 1) // Set clear color to dark blue
  renderer.setSize(container.clientWidth, container.clientHeight)
  container.appendChild(renderer.domElement)

  // Create camera
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  )
  camera.position.set(-5, 5, -5) // Further adjusted for better view of satellites
  camera.lookAt(0, 0, 0)

  // Add lights - enhanced for better Earth illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0) // Increased intensity and whiter light
  scene.add(ambientLight)

  // Main directional light (sun-like)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5) // Increased intensity
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

  // Satellites
  const satellites: Satellite[] = [];
  
  // Function to load satellite model
  const loadSatelliteModel = (satellite: Satellite, position: THREE.Vector3) => {
    const satelliteLoader = new GLTFLoader();
    satelliteLoader.load(
      satelliteModelPath,
      (gltf) => {
        const model = gltf.scene;
        // Scale the model appropriately - reduced for better visibility
        model.scale.set(0.0005, 0.0005, 0.0005); // Very small scale
        // Rotate the model to make it more visible
        model.rotation.x = Math.PI / 4;
        // Position the model
        model.position.copy(position);
        // Add the model to the scene
        scene.add(model);
        // Set the model for the satellite
        satellite.setModel(model);
        
        // Add a point light to each satellite to make it glow
        const satelliteLight = new THREE.PointLight(0xff0000, 2, 3);
        satelliteLight.position.set(0, 0, 0);
        model.add(satelliteLight);
        
        // Apply materials to all meshes in the model for better appearance
        model.traverse((child) => {
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
                    mat.shininess = 80;
                  }
                });
              } else {
                // Make material opaque
                child.material.transparent = false;
                child.material.opacity = 1.0;
                if (child.material.shininess !== undefined) {
                  child.material.shininess = 80;
                }
              }
            }
          }
        });
      },
      undefined,
      (error) => {
        console.error('An error happened loading the satellite model:', error);
        // Fallback to simple sphere if model fails to load
        const satelliteGeometry = new THREE.SphereGeometry(0.3, 16, 16); // Increased size
        const satelliteMaterial = new THREE.MeshPhongMaterial({
          color: 0xff0000,
          shininess: 80,
          emissive: 0xff0000, // Strong glow effect
          emissiveIntensity: 0.5
        });
        const satelliteMesh = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
        satelliteMesh.position.copy(position);
        scene.add(satelliteMesh);
        satellite.setModel(satelliteMesh);
      }
    );
  };
  
  // Create satellites in the x-z plane for better visibility
  for (let i = 0; i < numSatellites; i++) {
    const theta = (i / numSatellites) * Math.PI * 2;
    const x = satelliteRadius * Math.cos(theta);
    const z = satelliteRadius * Math.sin(theta);
    const satellite = new Satellite();
    satellite.setPosition(x, 0, z); // Position in the x-z plane
    satellites.push(satellite);
    loadSatelliteModel(satellite, new THREE.Vector3(x, 0, z));
  }
  
  // Create a parent object for the receiver to attach to the Earth
  const receiverParent = new THREE.Object3D();
  scene.add(receiverParent);
  
  // Receiver
  const receiverGeometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
  const receiverMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    shininess: 60,
    emissive: 0x00ff00, // Strong glow effect
    emissiveIntensity: 0.5
  });
  const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial);
  
  // Position the receiver at the equator
  const receiverDistance = earthRadius + 0.1; // Slightly above Earth's surface
  receiver.position.set(receiverDistance, 0, 0); // At the equator (x-axis)
  
  // Add the receiver to the parent object
  receiverParent.add(receiver);
  
  // Add a point light to the receiver to make it glow
  const receiverLight = new THREE.PointLight(0x00ff00, 2, 3);
  receiverLight.position.set(0, 0, 0);
  receiver.add(receiverLight);
  
  // Signal lines with increased visibility
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0x00ffff, // Bright cyan color for better visibility
    linewidth: 3 // Note: linewidth may not work in WebGL
  });
  const lines: THREE.Line[] = [];
  for (let i = 0; i < numSatellites; i++) {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([satellites[i].position, receiver.position]);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);
    lines.push(line);
  }

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
  
  // Calculate time dilation delta
  function calculateDelta(satellite: Satellite, mass: number): number {
    const r = satellite.position.length();
    const phiSat = -G * mass / r;
    const phiReceiver = -G * mass / earthRadius;
    const v = baseSatelliteSpeed / 1e6; // Scaled down for simulation
    const delta = (phiSat - phiReceiver) / (c * c) - (v * v) / (2 * c * c);
    return delta * 1e6; // Exaggerated for visibility
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

  // Simulation variables
  let simulationTime = 0;

  // Animation loop
  const animate = (): void => {
    requestAnimationFrame(animate)
    const rotation_speed = 0.001;
    
    // Rotate the Earth model if it's loaded
    if (earth) {
      earth.rotation.y += rotation_speed; // Slow rotation around y-axis
    }
    
    // Rotate the receiver parent to match Earth's rotation
    receiverParent.rotation.y += rotation_speed; // Same rotation speed as Earth
    
    // Update satellite positions and clocks
    const timeSpeed = 10.0; // Increased time speed for more noticeable movement
    const dt = (0.016 * timeSpeed) / 1e3; // Adjusted scaling for more visible simulation
    simulationTime += dt;
    
    const mass = parseFloat(massSlider.value) * 1e24;
    
    // Update satellite positions and clocks
    for (let i = 0; i < numSatellites; i++) {
      // Calculate new position based on orbit
      const theta = (i / numSatellites) * Math.PI * 2 + simulationTime * 0.5; // Rotate over time
      const x = satelliteRadius * Math.cos(theta);
      const z = satelliteRadius * Math.sin(theta); // Use z instead of y for horizontal orbit
      satellites[i].setPosition(x, 0, z); // Position in the x-z plane
      
      // Update satellite clock
      const delta = calculateDelta(satellites[i], mass);
      const dtau = (1 + delta) * dt;
      satellites[i].clock += satellites[i].clockRate * dtau;
    }
    
    // Update lines - use receiver's world position
    // Calculate receiver's world position
    const receiverWorldPosition = new THREE.Vector3();
    receiver.getWorldPosition(receiverWorldPosition);
    
    // Update lines to connect satellites to the receiver's world position
    for (let i = 0; i < numSatellites; i++) {
      lines[i].geometry.setFromPoints([satellites[i].position, receiverWorldPosition]);
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
