import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {VitePWA} from 'vite-plugin-pwa'

export default defineConfig({
    // Tells the browser where the app root is
    base: '/red-markets-sim/',
    plugins: [react(),
        VitePWA({
            registerType: 'autoUpdate', // This makes updates instant/easy
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'], // We'll create these later
            manifest: {
                name: 'Red Markets Enclave Manager', // Change this to your actual app name
                short_name: 'Enclaves',
                description: 'World economy manager for Market',
                theme_color: '#000000', // Matches your terminal aesthetic
                background_color: '#000000',
                display: 'standalone',
                icons: [
                    {
                        src: 'logo-192x192.png', // We will generate these placeholders
                        // next
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
                    // Split React and Mantine into a separate chunk
                    vendor: ['react', 'react-dom', '@mantine/core', '@mantine/hooks'],
                    // Split Dexie into its own chunk (optional, but good for caching)
                    db: ['dexie', 'dexie-react-hooks']
                }
            }
        }
    }
})