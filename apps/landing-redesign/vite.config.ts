import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // `@/` is the dashboard's src, so the shared shadcn components (which import
      // each other through `@/`) resolve the same way here. This app's own files use
      // relative imports.
      '@': fileURLToPath(new URL('../../src', import.meta.url)),
    },
    // Shared components import React from the root; make sure there's only one copy.
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3002,
  },
})
