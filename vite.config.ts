import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Servi par GitHub Pages sous https://bhenriet.github.io/voc_trainer/
const base = '/voc_trainer/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Voc Trainer',
        short_name: 'Voc Trainer',
        description: 'Flashcards de vocabulaire bilingue, importées depuis un fichier CSV.',
        lang: 'fr',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#f6f7f9',
        theme_color: '#2f5bd3',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
    }),
  ],
})
