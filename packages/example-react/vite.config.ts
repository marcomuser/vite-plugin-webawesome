import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import webawesome from 'vite-plugin-webawesome'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    webawesome({ styles: true }),
  ],
})
