import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // `@/` is this app's own src. Shared components come from `@workspace/ui/...`.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // The ui package has its own React for type-checking; make sure only one runs.
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3004,
  },
})
