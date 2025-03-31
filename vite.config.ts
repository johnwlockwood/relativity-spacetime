import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
    base: '/relativity-spacetime/',
    worker: {
        format: 'es',
        plugins: () => [],
        rollupOptions: {
            output: {
                format: 'es',
                inlineDynamicImports: true
            }
        }
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            output: {
                manualChunks: {
                    // Create separate chunk for Three.js core files
                    three_core: ['three'],
                    three_extras: [
                        'three/addons/loaders/GLTFLoader.js']
                },

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
