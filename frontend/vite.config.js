import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Locally, /api goes to the backend (`npm start` in backend/, port 3001).
    proxy: { '/api': 'http://localhost:3001' },
  },
})
