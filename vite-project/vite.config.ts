import react from '@vitejs/plugin-react-swc'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
import { resolve } from 'node:path';

export default {
  // build: {
  //   rollupOptions: {
  //     input: {
  //       devtools: resolve(__dirname, "devtools.html"),
  //       devtoolsPanel: resolve(__dirname, "panel.html")
  //     }
  //   }
  // },
  plugins: [
    react(),
    crx({ manifest }),
  ],
  server: {
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000
    }
  }
}