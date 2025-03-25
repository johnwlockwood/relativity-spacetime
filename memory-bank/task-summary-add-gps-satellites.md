# Task Summary: Add GPS Satellites and Receiver

## Task Description
Enhance the relativity-spacetime visualization by replacing the Earth sphere with a 3D Earth model, adding GPS satellites with the gps_satellite model, adding a receiver on the Earth's surface, and connecting the satellites to the receiver with lines.

## Steps Completed

1. Replaced the Earth sphere with a 3D model from the planet_earth directory:
   ```typescript
   // Import Earth model
   import earthModelPath from './planet_earth/scene.gltf?url';
   
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
     // ... error handling and fallback
   );
   ```

2. Updated the Satellite class to work with 3D models:
   ```typescript
   export class Satellite {
       clock: number;
       clockRate: number;
       model: THREE.Object3D | null;
       position: THREE.Vector3;
       
       constructor() {
           this.clock = 0;
           this.clockRate = 1;
           this.model = null;
           this.position = new THREE.Vector3();
       }
       
       setModel(model: THREE.Object3D) {
           this.model = model;
           this.position = this.model.position;
       }
       
       setPosition(x: number, y: number, z: number) {
           this.position.set(x, y, z);
           if (this.model) {
               this.model.position.set(x, y, z);
           }
       }
   }
   ```

3. Added satellites using the gps_satellite model:
   ```typescript
   // Import Satellite model
   import satelliteModelPath from './gps_satellite/scene.gltf?url';
   
   // Constants
   const satelliteRadius = 6; // Increased orbit radius to position satellites farther away
   const numSatellites = 4;
   
   // Function to load satellite model
   const loadSatelliteModel = (satellite: Satellite, position: THREE.Vector3) => {
     const satelliteLoader = new GLTFLoader();
     satelliteLoader.load(
       satelliteModelPath,
       (gltf) => {
         const model = gltf.scene;
         // Scale the model appropriately - reduced for better visibility
         model.scale.set(0.0001, 0.0001, 0.0001); // Very small scale
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
         // ... material enhancements
       },
       undefined,
       (error) => {
         // Fallback to simple sphere if model fails to load
         // ... fallback implementation
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
   ```

4. Added a receiver that rotates with the Earth:
   ```typescript
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
   ```

5. Added lines connecting the satellites to the receiver:
   ```typescript
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
   ```

6. Updated the animation loop to rotate the Earth and satellites, and update the lines:
   ```typescript
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
   ```

## Result
Successfully enhanced the relativity-spacetime visualization with a detailed 3D Earth model, GPS satellites, a receiver on the Earth's surface, and lines connecting the satellites to the receiver. The Earth and receiver rotate together, while the satellites orbit around the Earth. The lines correctly connect from the satellites to the receiver, even as the receiver rotates with the Earth.

## Key Technical Decisions
- **3D Models**: Used GLTFLoader to load both the Earth and satellite models, with appropriate scaling and positioning.
- **Satellite Class**: Updated the Satellite class to work with 3D models instead of simple spheres.
- **Receiver Rotation**: Created a parent object for the receiver to attach it to the Earth, making it follow the Earth's rotation.
- **Line Connections**: Used receiver.getWorldPosition() to get the receiver's position in world space, ensuring the lines correctly connect from the satellites to the receiver as it rotates with the Earth.
- **Visual Enhancements**: Added point lights to the satellites and receiver to make them more visible, and used bright cyan lines to connect the satellites to the receiver.
- **Orbit Radius**: Increased the orbit radius to position the satellites farther away from the Earth, making them more visible and realistic.

## Challenges and Solutions
- **Model Scaling**: The gps_satellite model was initially too large for the scene. Solved by reducing the scale to 0.0001.
- **Receiver Visibility**: The receiver was initially difficult to see. Solved by adding a point light to make it glow and using emissive materials.
- **Line Connections**: The lines initially didn't connect to the receiver as it rotated with the Earth. Solved by using receiver.getWorldPosition() to get the receiver's position in world space.
- **Z-Fighting**: The satellites sometimes appeared to render in front of the Earth even when positioned behind it. Solved by increasing the orbit radius to position the satellites farther away from the Earth.
