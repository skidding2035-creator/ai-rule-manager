import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Makes the deployed app installable ("アプリとしてインストール") from
    // Chrome/Edge, giving a desktop/taskbar icon that opens in its own
    // window — no dev server or terminal needed once this is deployed.
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AI Rule Manager',
        short_name: 'AI Rule Manager',
        description: 'AIに守らせるルールを一元管理するツール',
        lang: 'ja',
        start_url: '/',
        display: 'standalone',
        background_color: '#111315',
        theme_color: '#111315',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
