import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Disabled React Compiler due to compatibility issues with React 19
      // babel: {
      //   plugins: [['babel-plugin-react-compiler']],
      // },
    }),
  ],
  server: {
    port: 3500,
    host: true,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3500,
      clientPort: 3500,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
