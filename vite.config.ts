import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'favicon-32.png'],
      manifest: {
        name: 'LessGo — 스마트폰 사용 시간, 친구와 함께 줄여요',
        short_name: 'LessGo',
        description: '친구들과 함께 스마트폰 사용 시간을 줄이는 챌린지 앱',
        lang: 'ko',
        start_url: '/',
        display: 'standalone',
        background_color: '#F5F2EA',
        theme_color: '#3E93F0',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Never let the service worker cache API calls — cached signup/login
        // responses would silently serve stale data across accounts.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/lessgo-1krf\.onrender\.com\/api\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
