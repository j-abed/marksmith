/// <reference types="vitest/config" />
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const root = fileURLToPath(new URL('.', import.meta.url))
const pagesBuild = process.env.PAGES_BUILD === '1'
const tauriBuild = Boolean(process.env.TAURI_ENV_PLATFORM)
const appBase = pagesBuild ? './' : '/'
const pagesAppId = 'https://j-abed.github.io/marksmith/app/'
const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  base: appBase,
  clearScreen: false,
  resolve: {
    alias: tauriBuild
      ? {
          'virtual:pwa-register': resolve(root, 'src/stubs/pwa-register.ts'),
        }
      : undefined,
  },
  server: {
    port: 5173,
    strictPort: true,
    host: host ?? '127.0.0.1',
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  envPrefix: ['VITE_', 'TAURI_'],
  plugins: [
    react(),
    ...(tauriBuild
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png'],
            manifest: {
              id: pagesBuild ? pagesAppId : '/',
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
                  src: 'pwa-192.png',
                  sizes: '192x192',
                  type: 'image/png',
                  purpose: 'any',
                },
                {
                  src: 'pwa-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'any',
                },
                {
                  src: 'pwa-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
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
            devOptions: {
              enabled: true,
              type: 'module',
              suppressWarnings: true,
            },
          }),
        ]),
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
