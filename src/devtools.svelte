<script lang="ts">
import azureXrayPanel from "url:./panels/azure-xray/index.svelte"
import logo from "url:~/assets/icon.png"
import { fixChromePath } from "./util";

chrome.devtools.panels.create(
  "Azure XRay",
  fixChromePath(logo),
  fixChromePath(azureXrayPanel),
)
</script>

<div>
  <h2>
    This is a bootstrapper for devtools panels. It is never displayed directly.
  </h2>
</div>