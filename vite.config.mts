import react from '@vitejs/plugin-react-swc'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    tsconfigPaths()
  ],
  server: {
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000
    }
  }
})

