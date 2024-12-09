import { formatKqlQuery } from "./requestParser.js"
import type { AzureCommand, AzureResourceGraphQuery } from "./types.js"

export function generatePowerShellScript(request: AzureCommand): string {
  if (
    request.resourceId.provider === "Microsoft.ResourceGraph" &&
    "query" in request
  ) {
    return GenerateAzGraphSearchScript(request as AzureResourceGraphQuery)
  } else {
    return GenerateAzRestMethodScript(request as AzureCommand)
  }
}

// Thanks https://techcommunity.microsoft.com/blog/itopstalkblog/how-to-share-azure-resource-graph-queries-as-a-link/1485418
export function generateArqPortalUrl(query: string): string {
  const encodedQuery = encodeURIComponent(query)
  return `https://portal.azure.com/?feature.customportal=false#blade/HubsExtension/ArgQueryBlade/query/${encodedQuery}`
}

function GenerateAzGraphSearchScript(request: AzureResourceGraphQuery): string {
  return `#requires -Module Az.ResourceGraph\n\nSearch-AzGraph -Query @'\n${formatKqlQuery(request.query)}\n'@\n\n`
}

function GenerateAzRestMethodScript(request: AzureCommand): string {
  const indent = "  " // 2 spaces
  let script = "#requires -module Az.Accounts\n\n"

  if (request.url.searchParams && request.url.searchParams.size > 0) {
    script +=
      "#This request has query parameters and requires the Invoke-Restmethod URI method until https://github.com/Azure/azure-powershell/issues/26755 is fixed \n"
    script += '$query = [Web.HttpUtility]::ParseQueryString("")\n'
    request.url.searchParams.forEach((value, key) => {
      script += `$query['${key}'] = "${value}"\n`
    })
    script += `$query['api-version'] = "${request.apiVersion}"\n\n`
  }

  script += "$azrmParams = @{\n"

  // Query parameters are not currently supported with Invoke-AzRestMethod deconstructed style, we have to use the base URI. TODO: Split out into hashtables and use the URI builder
  if (request.url.searchParams && request.url.searchParams.size > 0) {
    const baseUrl = request.url.origin + request.url.pathname
    script += `${indent}Uri = "${baseUrl}?$($query.ToString())"\n`
  } else {
    const resourceId = request.resourceId

    const splatParams = {
      SubscriptionId: resourceId.subscriptionId,
      ResourceGroupName: resourceId.resourceGroup,
      ResourceProviderName: resourceId.provider,
      ResourceType: resourceId.resourceType,
      Name: resourceId.name,
      ApiVersion: request.apiVersion,
    }
    Object.entries(splatParams).forEach(([key, value]) => {
      if (value) {
        script += `${indent}${key} = '${value}'\n`
      }
    })

    if (request.content) {
      script += `${indent}Payload = @'\n${JSON.stringify(request.content, null, 2)}\n'@\n`
    }
  }

  // GET is implicit, so we don't need to specify it
  if (request.httpMethod !== "GET")
    script += `${indent}Method = '${request.httpMethod}'\n`

  script += "}\n\n"
  script +=
    "Invoke-AzRestMethod @azrmParams | Foreach-Object Content | ConvertFrom-Json -Depth 100"

  return script
}
