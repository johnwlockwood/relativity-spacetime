import * as THREE from 'three';

import { Satellite } from './Satellite'; // Import Satellite class

// Constants (real units, scaled for visualization)
const G = 6.6743e-11; // m³ kg⁻¹ s⁻²
const c = 299792458; // m/s
const earthRadius = 1; // Visual radius
const satelliteRadius = 3; // Exaggerated orbit radius
const numSatellites = 4;
const baseMass = 5.972e24; // Earth's mass in kg
const baseSatelliteSpeed = 3870; // m/s (GPS satellite speed)

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x524940); // Set background color to white
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('canvas') as HTMLCanvasElement,
    antialias: true,  // Enable anti-aliasing for smoother rendering
    alpha: true       // Support transparent background if needed
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Use device pixel ratio for sharper rendering
camera.position.set(5, 2, 8);
camera.lookAt(0, 0, 0);

// Add lighting
// Directional light from upper left
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(-5, 5, 3); // Position in the upper left
scene.add(directionalLight);

// Add ambient light for some base illumination
const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // soft white light
scene.add(ambientLight);

// Earth
const earthGeometry = new THREE.SphereGeometry(earthRadius, 32, 32);
const earthMaterial = new THREE.MeshPhongMaterial({
    color: 0x0066ff,
    transparent: true,
    opacity: 0.9,
    shininess: 30
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// Spacetime grid
const gridSize = 10;
const gridStep = 0.1;
// Create a proper 3D surface grid
const gridGeometry = new THREE.PlaneGeometry(gridSize, gridSize, gridSize / gridStep, gridSize / gridStep);
const gridMaterial = new THREE.MeshBasicMaterial({
    color: 0xdb7f23,
    wireframe: true,
    side: THREE.DoubleSide  // Make the grid visible from both sides
});
const grid = new THREE.Mesh(gridGeometry, gridMaterial);
grid.rotation.x = -Math.PI / 2; // Rotate to make it horizontal (XZ plane)
grid.position.y = -1.0; // Slightly below Earth
scene.add(grid);

// Add a flat grid helper for better spatial reference
const gridHelper = new THREE.GridHelper(gridSize, gridSize / gridStep, 0x888888, 0xBBBBBB);
gridHelper.position.y = -0.15; // Position slightly below the deformable grid
// scene.add(gridHelper);

// Satellites
const satellites: Satellite[] = [];
for (let i = 0; i < numSatellites; i++) {
    const theta = (i / numSatellites) * Math.PI * 2;
    const x = satelliteRadius * Math.cos(theta);
    const y = satelliteRadius * Math.sin(theta);
    const satelliteGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const satelliteMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        shininess: 80,
        emissive: 0x330000 // Slight glow effect
    });
    const satellite = new Satellite(satelliteGeometry, satelliteMaterial);
    satellite.position.set(x, y, 0);
    scene.add(satellite);
    satellites.push(satellite);
}

// Receiver
const receiverGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const receiverMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    shininess: 60,
    emissive: 0x003300 // Slight glow effect
});
const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial);
receiver.position.set(0, 0, earthRadius + 0.1); // Changed from -earthRadius to earthRadius to move to opposite side
scene.add(receiver);

// Signal lines
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
const lines: THREE.Line[] = [];
for (let i = 0; i < numSatellites; i++) {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([satellites[i].position, receiver.position]);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);
    lines.push(line);
}

// UI Elements
const massSlider = document.getElementById('massSlider') as HTMLInputElement;
const clockSpeedSlider = document.getElementById('clockSpeedSlider') as HTMLInputElement;
const timeSpeedSlider = document.getElementById('timeSpeedSlider') as HTMLInputElement;
const correctButton = document.getElementById('correctButton') as HTMLButtonElement;
const massValue = document.getElementById('massValue') as HTMLSpanElement;
const clockSpeedValue = document.getElementById('clockSpeedValue') as HTMLSpanElement;
const timeSpeedValue = document.getElementById('timeSpeedValue') as HTMLSpanElement;
const infoDiv = document.getElementById('info') as HTMLDivElement;

// Raycaster for hover
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Simulation variables
let simulationTime = 0;

// Update spacetime grid
function updateGrid(mass: number) {
    const k = (mass * G) / (c * c) * 5e2; // Adjusted scaling for visibility
    const positions = gridGeometry.attributes.position.array as Float32Array;
    const epsilon = 0.5; // Smoothing factor
    
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 1];
        const r = Math.sqrt(x * x + z * z);
        
        // Use a softened potential to avoid sharp spike at center
        positions[i + 2] = -k / (r + epsilon);
    }
    
    // Log the center vertex z value
    const widthSegments = gridSize / gridStep; // 100 segments
    const vertexCountPerRow = widthSegments + 1; // 101 vertices per row
    const centerRow = Math.floor(vertexCountPerRow / 2); // 50
    const centerCol = Math.floor(vertexCountPerRow / 2); // 50
    const centerVertexIndex = centerRow * vertexCountPerRow + centerCol; // 5100
    const centerZIndex = centerVertexIndex * 3 + 2; // 15302
    console.log('Center z:', positions[centerZIndex]);
    
    gridGeometry.attributes.position.needsUpdate = true;
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

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const timeSpeed = parseFloat(timeSpeedSlider.value);
    const dt = (0.016 * timeSpeed) / 1e6; // Scaled for simulation
    simulationTime += dt;

    const mass = parseFloat(massSlider.value) * 1e24;

    // Update satellite clocks
    let maxDeltaT = 0;
    for (let i = 0; i < numSatellites; i++) {
        const delta = calculateDelta(satellites[i], mass);
        const dtau = (1 + delta) * dt;
        satellites[i].clock += satellites[i].clockRate * dtau;
        const deltaT = Math.abs(satellites[i].clock - simulationTime);
        maxDeltaT = Math.max(maxDeltaT, deltaT);
    }

    // Estimate position error
    const positionError = c * maxDeltaT; // Meters

    // Update lines
    for (let i = 0; i < numSatellites; i++) {
        lines[i].geometry.setFromPoints([satellites[i].position, receiver.position]);
    }

    renderer.render(scene, camera);

    // Hover effect
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(receiver);
    if (intersects.length > 0) {
        infoDiv.classList.remove('hidden');
        infoDiv.style.left = `${mouse.x * window.innerWidth / 2 + window.innerWidth / 2 + 10}px`;
        infoDiv.style.top = `${-mouse.y * window.innerHeight / 2 + window.innerHeight / 2 + 10}px`;
        infoDiv.innerHTML = `Position Calculation:<br>Using signals from ${numSatellites} satellites.<br>Current Error: ${positionError.toFixed(2)} meters`;
    } else {
        infoDiv.classList.add('hidden');
    }
}
animate();

// Event listeners
massSlider.addEventListener('input', () => {
    massValue.textContent = parseFloat(massSlider.value).toFixed(3);
    updateGrid(parseFloat(massSlider.value) * 1e24);
});

clockSpeedSlider.addEventListener('input', () => {
    clockSpeedValue.textContent = parseFloat(clockSpeedSlider.value).toFixed(5);
    const rate = parseFloat(clockSpeedSlider.value);
    satellites.forEach(sat => sat.clockRate = rate);
});

timeSpeedSlider.addEventListener('input', () => {
    timeSpeedValue.textContent = `${timeSpeedSlider.value}x`;
});

correctButton.addEventListener('click', () => {
    const mass = parseFloat(massSlider.value) * 1e24;
    for (let i = 0; i < numSatellites; i++) {
        const delta = calculateDelta(satellites[i], mass);
        satellites[i].clockRate = 1 - delta;
    }
    clockSpeedValue.textContent = satellites[0].clockRate.toFixed(5);
    clockSpeedSlider.value = satellites[0].clockRate.toString();
});

document.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Initial grid setup
updateGrid(baseMass);
