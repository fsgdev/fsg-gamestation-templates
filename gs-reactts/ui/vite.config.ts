import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' keeps the built page's links relative, so it loads from https://cfx-nui-<resource>/ui/dist/.
// The dev server's port is the one Config.DevServer points at (config.lua), so it must not move.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 3000, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
})
