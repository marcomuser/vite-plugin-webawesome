import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import webawesome from 'vite-plugin-webawesome'

export default defineConfig({
  plugins: [vue(), webawesome({ styles: true })],
  server: { port: 5174 },
})
