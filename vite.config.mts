import { crx } from "@crxjs/vite-plugin"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import manifest from "./manifest.json"

export default defineConfig({
  plugins: [react(), crx({ manifest }), tsconfigPaths()],
  server: {
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
  },
  build: {
    rollupOptions: {
      input: {
        // Devtools and popup are handled by crxjs. Panels need to be a separate input so their css styles get loaded correctly.
        // TODO: Add a transform so this can live in /src/panels
        azureXrayPanel: "panel-azureXRay.html",
      },
      output: {
        // Split out big chunks into their own files. Since our extension is local and doesn't have to load remotely this isn't much of a startup hit.
        manualChunks: id => {
          switch (true) {
            case id.includes("mantine"):
              return "mantine"
            case id.includes("react"):
              return "react"
            case id.includes("highlight"):
              return "highlight"
            case id.includes("node_modules"):
              return "vendor"
            case id.includes("azureIconMap"):
              return "azureIconMap"
            default:
              console.log("Chunking", id)
              return null
          }
        },
      },
    },
  },
})
