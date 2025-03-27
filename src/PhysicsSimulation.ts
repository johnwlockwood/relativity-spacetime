import * as THREE from 'three';
import { Satellite } from './Satellite';

export class PhysicsSimulation {
    private G = 6.6743e-11; // m³ kg⁻¹ s⁻²
    private c = 299792458; // m/s
    private earthRadius = 1;
    private initialMass = 5.972e24; // Default Earth mass in kg
    private mass = this.initialMass; // Current mass
    private satelliteRadius = 6;
    private baseSatelliteSpeed = 3870; // m/s (GPS satellite speed)
    private realUniverseAge = 13.8e9; // Real age of the universe in years (13.8 billion years)
    private expansionRate = 0.02; // 4x faster expansion
    private currentExpansionRate = this.expansionRate;
    
    private satellites: Satellite[] = [];
    private simulationTime = 0;
    private orbitTime = 0;
    private expansionFactor = 1.0;
    private _isPaused = false;
    private earthRotationAngle = 0;
    private earthRotationSpeed = 0.001;
    private lastUpdateTime = 0;
    private accumulator = 0;
    private fixedTimeStep = 1/60; // 60 physics updates per second

    get isPaused(): boolean {
        return this._isPaused;
    }

    constructor(satellites: Satellite[]) {
        this.satellites = satellites;
    }

    setPaused(paused: boolean) {
        if (this._isPaused && !paused) {
            // When unpausing, reset lastUpdateTime to prevent large delta
            this.lastUpdateTime = performance.now();
        }
        this._isPaused = paused;
    }

    reset() {
        this.simulationTime = 0;
        this.orbitTime = 0;
        this.expansionFactor = 1.0;
        this.mass = this.initialMass;
    }

    getMass(): number {
        return this.mass;
    }

    setMass(mass: number) {
        this.mass = mass;
    }

    update(currentTime: number) {
        if (this._isPaused) {
            // When paused, don't update lastUpdateTime to prevent time accumulation
            return;
        }

        if (this.lastUpdateTime === 0) {
            this.lastUpdateTime = currentTime;
            return;
        }

        let deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
        this.lastUpdateTime = currentTime;

        // Fixed timestep physics
        this.accumulator += deltaTime;
        while (this.accumulator >= this.fixedTimeStep) {
            this.fixedUpdate();
            this.accumulator -= this.fixedTimeStep;
        }
    }

    private fixedUpdate() {
        const timeSpeed = 4132.2;
        const dt = (this.fixedTimeStep * timeSpeed) / 1e3;
        this.simulationTime += dt;

        // Separate dt for orbit to maintain original speed
        const orbitDt = (this.fixedTimeStep * 10.0) / 1e3;
        this.orbitTime += orbitDt;
        this.expansionFactor += this.currentExpansionRate * dt;

        // Update satellite positions and clocks
        for (let i = 0; i < this.satellites.length; i++) {
            const theta = (i / this.satellites.length) * Math.PI * 2 + this.orbitTime * 0.5;
            const x = this.satelliteRadius * Math.cos(theta);
            const z = this.satelliteRadius * Math.sin(theta);
            this.satellites[i].setPosition(x, 0, z);

            const delta = this.calculateDelta(this.satellites[i]);
            const dtau = (1 + delta) * dt;
            this.satellites[i].clock += this.satellites[i].clockRate * dtau;
        }

        // Update Earth rotation
        this.earthRotationAngle += this.earthRotationSpeed * dt;
    }

    private calculateDelta(satellite: Satellite): number {
        const r = satellite.position.length();
        const phiSat = -this.G * this.mass / r;
        const phiReceiver = -this.G * this.mass / this.earthRadius;
        const v = this.baseSatelliteSpeed / 1e6;
        return (phiSat - phiReceiver) / (this.c * this.c) - (v * v) / (2 * this.c * this.c);
    }

    getUniverseAge(): number {
        const simulationDuration = 300;
        let universeAge = (this.simulationTime / simulationDuration) * this.realUniverseAge;
        return Math.min(universeAge, this.realUniverseAge);
    }

    getExpansionFactor(): number {
        return this.expansionFactor;
    }

    getSatellitePositions(): THREE.Vector3[] {
        return this.satellites.map(s => s.position.clone());
    }

    getEarthRotation(): number {
        return this.earthRotationAngle;
    }

    setEarthRotationSpeed(speed: number) {
        this.earthRotationSpeed = speed;
    }
}
