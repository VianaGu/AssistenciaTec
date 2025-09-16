import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // permite acesso externo (0.0.0.0)
    allowedHosts: [
      "86434199db0a.ngrok-free.app" // seu host ngrok
    ]
  }
})
