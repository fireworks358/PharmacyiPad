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
        safari: (14 << 16), // Safari 14.0 (iPadOS 14+)
      },
    },
  },
  build: {
    cssMinify: 'lightningcss',
  },
})
