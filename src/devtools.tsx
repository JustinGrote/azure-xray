import iconUri from "../assets/icon.png"
chrome.devtools.panels.create(
  "Azure X-Ray",
  iconUri,
  // See vite.config.mts inputs
  "/panel-azureXRay.html",
)
