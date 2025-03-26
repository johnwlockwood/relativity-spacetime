import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
    base: '/relativity-spacetime/',
    build: {
        outDir: 'docs',
        rollupOptions: {
            output: {
                manualChunks: {
                    // Create separate chunk for Three.js core files
                    three_core: ['three'],
                    three_extras: [
                        'three/addons/loaders/GLTFLoader.js']
                }
            }
        }
    },
    plugins: [
        visualizer({
            open: true,
            gzipSize: true,
            brotliSize: true,
        })
    ],
});