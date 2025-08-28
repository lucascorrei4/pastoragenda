import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'PastorTalk',
        short_name: 'PastorTalk',
        description: 'Schedule appointments with pastors and religious leaders',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9IiMzYjgyZjYiLz4KPHN2ZyB4PSI0OCIgeT0iNDgiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik04IDJIMTZMMTkgNkg1TDggMloiLz4KPHBhdGggZD0iTTQgOEgyMFYxOEMyMCAxOS4xMDQ2IDE5LjEwNDYgMjAgMTggMjBINkM0Ljg5NTQzIDIwIDQgMTkuMTA0NiA0IDE4VjhaIi8+CjxwYXRoIGQ9Ik0xMCAxMkgxNFYxNkgxMFYxMloiLz4KPHBhdGggZD0iTTEwIDE4SDE0VjIySDEwVjE4WiIvPgo8L3N2Zz4KPC9zdmc+',
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico}']
      }
    })
  ],
  server: {
    port: 3000,
    host: true
  }
})
