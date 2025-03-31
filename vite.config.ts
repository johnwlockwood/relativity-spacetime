import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
    base: '/relativity-spacetime/',
    worker: {
        format: 'es',
        plugins: () => [],
        rollupOptions: {
            output: {
                // Disable hash in filenames
                entryFileNames: `assets/[name].js`,
                chunkFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name].[ext]`,
                format: 'es',
                inlineDynamicImports: true
            }
        }
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            output: {
                // Disable hash in filenames
                entryFileNames: `assets/[name].js`,
                chunkFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name].[ext]`,
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
