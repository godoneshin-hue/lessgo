import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' (not 'autoUpdate') so onNeedRefresh in src/lib/pwaUpdate.ts
      // actually fires — under 'autoUpdate' the generated register script
      // never calls onNeedRefresh at all (it only reloads on its own
      // 'activated' event), so the update banner was silently dead code.
      registerType: 'prompt',
      includeAssets: ['apple-touch-icon.png', 'favicon-32.png'],
      manifest: {
        name: 'LessGo — 스마트폰 사용 시간, 친구와 함께 줄여요',
        short_name: 'LessGo',
        description: '친구들과 함께 스마트폰 사용 시간을 줄이는 챌린지 앱',
        lang: 'ko',
        start_url: '/',
        display: 'standalone',
        background_color: '#F3F5FA',
        theme_color: '#2E5FE8',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Never precache-serve the HTML shell. Its script/style tags point
        // at content-hashed filenames from whichever build was active when
        // it was cached — once the next deploy ships, those old filenames
        // are gone from the server. A returning user whose old service
        // worker was still serving the old cached shell would hit a hard
        // 404 on the JS bundle and get a permanently blank page (this was
        // live and is what "사이트 들어가면 아무것도 안떠" was). Navigations
        // must always go to the network so the shell they get always
        // matches what's actually deployed; Vercel's own SPA rewrite
        // (vercel.json) already serves index.html for any path, so this
        // loses nothing except an offline-only edge case this app can't
        // support anyway (verification needs the network regardless).
        navigateFallback: null,
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
