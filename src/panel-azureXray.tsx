import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import AzureXrayPanel from "./azureXrayPanel.tsx"
import "@mantine/core/styles.layer.css"
import "mantine-datatable/styles.layer.css"
import "@mantine/code-highlight/styles.css"
// import "highlight.js/styles/github.css";
import "./theme-overrides.css"
import "./theme-highlightjs-vscode.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AzureXrayPanel />
  </StrictMode>,
)
