import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    // Tells the browser where the app root is
    base: '/red-markets-sim/',
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate', // Keeps the service worker up-to-date
            
            // Include all necessary assets for caching (Icons, manifest files)
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'manifest.json'], 
            
            manifest: {
                name: 'Red Markets Enclave Manager',
                short_name: 'Enclaves',
                description: 'World economy manager for Market',
                theme_color: '#000000',
                background_color: '#000000',
                display: 'standalone',
                icons: [
                    {
                        src: 'logo-192x192.png', // These files must exist in the public/ folder
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'logo-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    }
                ]
            }
        })
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Keep this optimization for chunking vendor libraries
                    vendor: ['react', 'react-dom', '@mantine/core', '@mantine/hooks'],
                    // Split Dexie into its own chunk (optional, but good for caching)
                    db: ['dexie', 'dexie-react-hooks']
                }
            }
        }
    }
});