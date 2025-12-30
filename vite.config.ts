import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Tells the browser where the app root is
  base: '/red-markets-sim/',
  plugins: [react()],
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