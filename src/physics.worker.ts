/// <reference lib="webworker" />

import { PhysicsSimulation } from './PhysicsSimulation';
import { Satellite } from './Satellite';

declare const self: DedicatedWorkerGlobalScope;

let simulation: PhysicsSimulation;
let satellites: Satellite[] = [];

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'init':
      // Create new Satellite instances from serialized data
      satellites = payload.satellites.map((s: any) => {
        const sat = new Satellite();
        sat.position.set(s.position.x, s.position.y, s.position.z);
        return sat;
      });
      simulation = new PhysicsSimulation(satellites);
      break;

    case 'update':
      if (!simulation) return;
      simulation.update(payload.timestamp, payload.mass);
      
      // Send back updated state
      self.postMessage({
        type: 'update',
        payload: {
          positions: simulation.getSatellitePositions(),
          rotation: simulation.getEarthRotation(),
          expansion: simulation.getExpansionFactor(),
          universeAge: simulation.getUniverseAge()
        }
      });
      break;

    case 'pause':
      simulation?.setPaused(payload.paused);
      break;

    case 'reset':
      simulation?.reset();
      break;
  }
};

// Error handling
self.onerror = (error) => {
  console.error('Physics worker error:', error);
  self.postMessage({ type: 'error', payload: error });
};
