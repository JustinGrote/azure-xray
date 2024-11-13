<script lang="ts">
  interface AzureApiRequest {
    httpMethod: string;
    name: string;
    requestHeaderDetails: AzureApiRequestHeaderDetails;
    url: string;
  }

  interface AzureApiRequestHeaderDetails {
    commandName: string;
  }

  interface AzureApiRequests {
    requests: AzureApiRequest[];
  }

  let reqs: AzureApiRequest[] = [];

  function handleRequestFinished(traceEntry: chrome.devtools.network.Request) {
    const url: string = traceEntry?.request?.url as string;
    if (!url?.startsWith("https://management.azure.com/batch")) return;
    const reqData: AzureApiRequests = JSON.parse(traceEntry?.request?.postData?.text);
    if (!reqData?.requests) {
      console.warn("Azure X-Ray request detected but no requests found. Probably a bug", url, reqData);
      return;
    }
    const requests = reqData.requests;
    requests.forEach((requestItem) => {
      requestItem.url = requestItem.url.replace(/^https:\/\/management\.azure\.com/, "");
      console.log("Azure X-Ray request detected", requestItem.httpMethod, requestItem.requestHeaderDetails.commandName, requestItem.url);
      reqs = [...reqs, requestItem];
    });
  }

  chrome.devtools.network.onRequestFinished.addListener(handleRequestFinished);
</script>

<style>
  :global(body) {
    background-color: #202124;
    color: #e8eaed;
    margin: 0;
  }
</style>

<div style="background-color: #202124; min-height: 100vh; padding: 16px;">
  <div>
    <h2>Azure X-Ray</h2>
    {#if reqs.length > 0}
      <div>
        <h3>Request Details</h3>
        <table style="width: 100%; border-collapse: collapse">
          <thead>
            <tr style="background-color: #3c4043; color: #e8eaed">
              <th style="padding: 8px; text-align: left">Method</th>
              <th style="padding: 8px; text-align: left">Command</th>
              <th style="padding: 8px; text-align: left">URL</th>
            </tr>
          </thead>
          <tbody>
            {#each reqs as req, index}
              <tr style="background-color: {index % 2 === 0 ? '#292a2d' : '#202124'}; color: #e8eaed; border-bottom: 1px solid #3c4043">
                <td style="color: #e8eaed; padding: 8px">{req.httpMethod}</td>
                <td style="color: #e8eaed; padding: 8px">{req.requestHeaderDetails.commandName}</td>
                <td style="color: #e8eaed; padding: 8px">{req.url}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>