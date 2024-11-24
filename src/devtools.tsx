import panelHtmlUrl from "../testPanel.html?url"
import iconUri from "../assets/icon.png"
chrome.devtools.panels.create(
  "Azure X-Ray",
  iconUri,
  // See vite.config.mts inputs
  panelHtmlUrl,
)