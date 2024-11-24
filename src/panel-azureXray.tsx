import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import AzureXrayPanel from "./azureXrayPanel.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AzureXrayPanel />
  </StrictMode>,
)
