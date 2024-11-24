import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import AzureXrayPanel from "./azure-xray.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AzureXrayPanel />
  </StrictMode>
)