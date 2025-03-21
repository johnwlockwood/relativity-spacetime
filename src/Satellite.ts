import * as THREE from 'three';

export class Satellite extends THREE.Mesh {
    clock: number;
    clockRate: number;

    constructor(geometry: THREE.SphereGeometry, material: THREE.MeshPhongMaterial) {
        super(geometry, material);
        this.clock = 0;
        this.clockRate = 1;
    }
}
