import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'monogram-logo.png'],
      manifest: {
        name: 'Kabakal Gym',
        short_name: 'Kabakal',
        description: 'The premier fitness center app',
        theme_color: '#060407',
        background_color: '#060407',
        display: 'standalone',
        icons: [
          {
            src: 'monogram-logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'monogram-logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
