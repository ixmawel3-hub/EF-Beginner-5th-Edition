import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import path from 'path'

// https://vite.dev/config/
// Keep existing base logic; configure assetFileNames to preserve original
// filenames for media/pdf assets (remove the generated hash suffix).
export default defineConfig({
  base: '/EF-Beginner-5th-Edition/',
  plugins: [react()]
})
