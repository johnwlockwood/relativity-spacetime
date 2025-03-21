// Type declarations for Three.js CDN
// This file tells TypeScript about the global THREE object

import * as ThreeNamespace from 'three';

declare global {
  const THREE: typeof ThreeNamespace;
}
