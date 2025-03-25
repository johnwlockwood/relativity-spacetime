import * as THREE from 'three';

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
