import './style.css'
// Import Three.js as ES module
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PhysicsSimulation } from './PhysicsSimulation';
// Import Earth model
const earthModelPath = `${import.meta.env.BASE_URL}planet_earth/scene.gltf`;
// Import Satellite model
const satelliteModelPath = `${import.meta.env.BASE_URL}low_poly_satellite/scene.gltf`;
// Import Satellite class
import { Satellite } from './Satellite'

// Constants (real units, scaled for visualization)
const G = 6.6743e-11; // m³ kg⁻¹ s⁻²
const c = 299792458; // m/s
const earthRadius = 1; // Visual radius
const satelliteRadius = 6; // Increased orbit radius to position satellites farther away
const numSatellites = 9;
// These constants are now used in PhysicsSimulation.ts

// Create a container for the Three.js canvas
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="three-container" id="three-container"></div>
  <div class="ui-container">
    <div class="slider-container">
      <label>Planet Mass (x10²⁴ kg):</label>
      <input type="range" id="massSlider" min="1" max="10" value="5.972" step="0.1">
      <span id="massValue">5.972</span>
    </div>
    <div class="timeline-container">
      <label>Age of Universe:</label>
      <span id="universeAge">0 years</span>
      <span id="nowLabel" class="now-label"> (This is "Now")</span>
    </div>
    <div class="button-container">
      <button id="pauseButton">Pause</button>
      <button id="resetButton">Reset</button>
    </div>
  </div>
`

// Set up Three.js scene
const setupThreeScene = (): void => {
  const container = document.getElementById('three-container')
  if (!container) return

  // Create scene
  const scene = new THREE.Scene()

  // Add cosmic background (starry skybox)
  const textureLoader = new THREE.CubeTextureLoader();
  const skyboxTextures = [
    `${import.meta.env.BASE_URL}textures/cube/MilkyWay/dark-s_px.jpg`,
    `${import.meta.env.BASE_URL}textures/cube/MilkyWay/dark-s_nx.jpg`,
    `${import.meta.env.BASE_URL}textures/cube/MilkyWay/dark-s_py.jpg`,
    `${import.meta.env.BASE_URL}textures/cube/MilkyWay/dark-s_ny.jpg`,
    `${import.meta.env.BASE_URL}textures/cube/MilkyWay/dark-s_pz.jpg`,
    `${import.meta.env.BASE_URL}textures/cube/MilkyWay/dark-s_nz.jpg`
  ];
  const skybox = textureLoader.load(skyboxTextures);
  scene.background = skybox;

  // Create renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true // Enable alpha
  })
  renderer.setClearColor(0x1d2237, 1) // Set clear color to dark blue (fallback if skybox fails)
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

  // Add OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.25
  controls.screenSpacePanning = false
  controls.maxPolarAngle = Math.PI
  controls.minDistance = 3
  controls.maxDistance = 20

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
      earth.scale.set(earthRadius, earthRadius, earthRadius);
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
  const satelliteScale = 0.2
  const receiverGeometry = new THREE.BoxGeometry(satelliteScale, satelliteScale, satelliteScale);
  const receiverMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    shininess: 60,
    emissive: 0x00ff00, // Strong glow effect
    emissiveIntensity: 0.1
  });
  const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial);

  // Position the receiver at the equator
  const receiverDistance = earthRadius + 0.1; // Slightly above Earth's surface
  receiver.position.set(receiverDistance, 0, 0); // At the equator (x-axis)

  // Add the receiver to the parent object
  receiverParent.add(receiver);

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
  // Original grid parameters
  const originalGridSize = 3.0;
  const originalGridSegments = 4.0;
  const originalSegments = Math.ceil(originalGridSize * originalGridSegments);
  let expansionFactor = 1.0; // Initial scale of the universe
  let gridSize = originalGridSize; // Start at size 1
  let gridSegments = originalSegments;
  let gridGeometry = new THREE.PlaneGeometry(gridSize, gridSize, gridSegments, gridSegments);
  const gridMaterial = new THREE.MeshBasicMaterial({
    color: "rgb(0, 161, 140)",
    wireframe: true,
    side: THREE.DoubleSide
  });
  const grid = new THREE.Mesh(gridGeometry, gridMaterial);
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = -1.0;
  scene.add(grid);

  // Track when to increase grid resolution
  let lastResolutionIncrease = 1.0;
  const resolutionIncreaseFactor = 1.2;

  function updateGrid(mass: number, expansion: number) {
    // Increase grid resolution when expansion crosses threshold
    if (expansion >= lastResolutionIncrease * resolutionIncreaseFactor) {
      // Get current physical size before changing geometry
      const currentPhysicalSize = originalGridSize * expansion;
      console.log("gridSize: " + gridSize);
      console.log("currentPhysicalSize: " + currentPhysicalSize);

      lastResolutionIncrease = expansion;
      gridSize = currentPhysicalSize; // Maintain current visual size
      gridSegments = Math.ceil(gridSize * 4); // about four segments per 1.0

      console.log("grid.scale.x: " + grid.scale.x + " expansion: " + expansion + 
        + "  grid size: " + gridSize + " N segments: " + gridSegments);

      // Create new geometry with more segments at base size 1
      const newGeometry = new THREE.PlaneGeometry(
        gridSize / expansion, // Base size
        gridSize / expansion, // Base size 
        gridSegments,
        gridSegments
      );

      // Replace geometry while maintaining current scale
      grid.geometry.dispose();
      grid.geometry = newGeometry;
      gridGeometry = newGeometry;
    }

    // Update curvature for current geometry
    const k = (mass * G) / (c * c) * 3e2;
    const epsilon = 0.5 / expansion;
    const positions = gridGeometry.attributes.position.array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];
      const r = Math.sqrt(x * x + z * z);
      positions[i + 2] = -k * Math.exp(-(r * r) / (2 * epsilon * epsilon));
    }

    // Scale the grid smoothly
    const targetScale = expansion;
    grid.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), 0.1);

    gridGeometry.attributes.position.needsUpdate = true;
  }

  // Mass slider elements
  const massSlider = document.getElementById('massSlider') as HTMLInputElement;
  const massValue = document.getElementById('massValue') as HTMLSpanElement;
  const universeAgeElement = document.getElementById('universeAge') as HTMLSpanElement;
  const pauseButton = document.getElementById('pauseButton') as HTMLButtonElement;
  const resetButton = document.getElementById('resetButton') as HTMLButtonElement;

  // Initialize grid with default mass
  updateGrid(parseFloat(massSlider.value) * 1e24, expansionFactor);

  massSlider.addEventListener('input', () => {
    const massVal = parseFloat(massSlider.value);
    massValue.textContent = massVal.toFixed(3);
    if (physicsWorker) {
      physicsWorker.postMessage({
        type: 'massUpdate',
        payload: { mass: massVal * 1e24 }
      });
    } else {
      physicsSimulation.setMass(massVal * 1e24);
    }
  });

  // Physics simulation setup
  let physicsSimulation: PhysicsSimulation;
  let physicsWorker: Worker | null = null;

  try {
    // Try to use Web Worker first
    physicsWorker = new Worker(new URL('./physics.worker.ts', import.meta.url), {
      type: 'module'
    });
    physicsWorker.postMessage({
      type: 'init',
      payload: { satellites }
    });
  } catch (e) {
    console.warn('Web Workers not supported, falling back to main thread');
    physicsSimulation = new PhysicsSimulation(satellites);
  }

  // Pause/Resume and Reset functionality
  pauseButton.addEventListener('click', () => {
    if (physicsWorker) {
      physicsWorker.postMessage({
        type: 'pause',
        payload: { paused: !pauseButton.textContent?.includes('Resume') }
      });
    } else {
      physicsSimulation.setPaused(!physicsSimulation.isPaused);
    }
    pauseButton.textContent = pauseButton.textContent?.includes('Pause') ? 'Resume' : 'Pause';
  });

  resetButton.addEventListener('click', () => {
    if (physicsWorker) {
      physicsWorker.postMessage({ type: 'reset' });
    } else {
      physicsSimulation.reset();
    }
    const resetMass = 5.972;
    massSlider.value = resetMass.toString();
    massValue.textContent = resetMass.toFixed(3);

    // Reset grid to original state
    gridSize = originalGridSize;
    lastResolutionIncrease = 1.0;

    // Create new geometry with original segments
    const newGeometry = new THREE.PlaneGeometry(
      originalGridSize,
      originalGridSize,
      originalSegments,
      originalSegments
    );

    // Replace geometry
    grid.geometry.dispose();
    grid.geometry = newGeometry;
    gridGeometry = newGeometry;

    // Reset scale and update curvature
    grid.scale.set(1, 1, 1);
    updateGrid(resetMass * 1e24, 1.0);
    universeAgeElement.textContent = '0 years';
  });

  // Animation loop
  const animate = (timestamp = 0): void => {
    requestAnimationFrame(animate);

    // Update physics
    if (physicsWorker) {
      physicsWorker.postMessage({
        type: 'update',
        payload: {
          timestamp,
          mass: parseFloat(massSlider.value) * 1e24
        }
      });
    } else {
      physicsSimulation.setMass(parseFloat(massSlider.value) * 1e24);
      physicsSimulation.update(timestamp);
    }

    // Update controls
    controls.update();
    renderer.render(scene, camera);
  };

  // Handle worker messages
  if (physicsWorker) {
    physicsWorker.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'update') {
        // Update UI
        universeAgeElement.textContent = `${(payload.universeAge / 1e9).toFixed(1)} billion years`;

        // Update grid
        updateGrid(payload.mass, payload.expansion);

        // Update Earth and receiver rotation
        if (earth) earth.rotation.y = payload.rotation;
        receiverParent.rotation.y = payload.rotation;

        // Update satellite positions
        for (let i = 0; i < numSatellites; i++) {
          satellites[i].setPosition(payload.positions[i].x, payload.positions[i].y, payload.positions[i].z);
        }

        // Update lines
        const receiverWorldPosition = new THREE.Vector3();
        receiver.getWorldPosition(receiverWorldPosition);
        for (let i = 0; i < numSatellites; i++) {
          lines[i].geometry.setFromPoints([
            new THREE.Vector3(payload.positions[i].x, payload.positions[i].y, payload.positions[i].z),
            receiverWorldPosition
          ]);
        }
      }
    };
  }

  animate();

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // Touch events for mobile
  let touchStartX = 0;
  let touchStartY = 0;

  container.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!e.touches.length) return;

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;

    const deltaX = touchX - touchStartX;
    const deltaY = touchY - touchStartY;

    // Rotate camera based on touch movement
    const rotationSpeed = 0.02;
    controls.target.x -= deltaX * rotationSpeed;
    controls.target.y += deltaY * rotationSpeed;

    touchStartX = touchX;
    touchStartY = touchY;

    e.preventDefault();
  }, { passive: false });
};

// Initialize Three.js scene
setupThreeScene();
