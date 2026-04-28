import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-router')) return 'vendor';
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('framer-motion') || id.includes('gsap')) return 'animation';
            if (id.includes('three') || id.includes('lucide-react')) return 'ui';
            return 'deps';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
