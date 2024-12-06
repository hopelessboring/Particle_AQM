import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        past: 'past.html',
        information: 'information.html',
        submit: 'submit.html'
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
}) 