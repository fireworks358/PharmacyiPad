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
        safari: (12 << 16), // Safari 12.0 (iOS 12+)
      },
    },
  },
  build: {
    cssMinify: 'lightningcss',
  },
})
