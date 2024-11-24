import iconUri from "../assets/icon.png"
import packageJson from "../package.json"
chrome.devtools.panels.create(
  packageJson.displayName,
  iconUri,
  // See vite.config.mts inputs. This has to be a separate input for CSS to be bundled correctly.
  "/panel-azureXRay.html",
)