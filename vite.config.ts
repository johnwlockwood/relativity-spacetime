import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
    base: '/relativity-spacetime/',
    build: {
        outDir: 'docs',
        // chunkSizeWarningLimit: 1000, // in kB
        rollupOptions: {
            output: {
                manualChunks: {
                    // Create separate chunk for Three.js core files
                    three_core: ['three'],
                    three_extras: [
                        'three/addons/loaders/GLTFLoader.js']
                },
                // Disable hash in filenames
                // entryFileNames: `assets/[name].js`,
                // chunkFileNames: `assets/[name].js`,
                // assetFileNames: `assets/[name].[ext]`
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