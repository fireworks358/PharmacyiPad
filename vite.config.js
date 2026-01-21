import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/PharmacyiPad/',
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        safari: (15 << 16) | (4 << 8), // Safari 15.4 (iPadOS 15.4+)
      },
    },
  },
  build: {
    cssMinify: 'lightningcss',
  },
})
