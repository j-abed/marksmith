/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const pagesBuild = process.env.PAGES_BUILD === '1'
const appBase = pagesBuild ? './' : '/'

export default defineConfig({
  base: appBase,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Marksmith',
        short_name: 'Marksmith',
        description:
          'Local Markdown editor where Markdown is the canonical source of truth.',
        theme_color: '#0f1117',
        background_color: '#0f1117',
        display: 'standalone',
        start_url: appBase,
        scope: appBase,
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  build: {
    outDir: pagesBuild ? 'docs/app' : 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@codemirror') || id.includes('@lezer')) return 'codemirror'
          if (
            id.includes('/unified') ||
            id.includes('/remark-') ||
            id.includes('/rehype-') ||
            id.includes('/highlight.js')
          ) {
            return 'markdown'
          }
          if (id.includes('react-dom') || id.includes('/react/')) return 'react'
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
})
