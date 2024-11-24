import type { AzureApiRequest } from "./types.js"

interface ParsedAzureUrl {
  subscriptionId?: string
  resourceGroupName?: string
  resourceProviderName?: string
  resourceType?: string[]
  name?: string[]
  apiVersion?: string
  otherParams?: Record<string, string>
}

const indent = "  " // 2 spaces

function parseAzureUrl(url: string): ParsedAzureUrl {
  // Remove leading slash if present
  const pathAndQuery = url.replace(/^\//, "")
  const [path, query] = pathAndQuery.split("?")
  const pathParts = path.split("/")
  const params: Record<string, string> = {}

  // Parse query parameters
  if (query) {
    for (const param of query.split("&")) {
      const [key, value] = param.split("=")
      params[key] = decodeURIComponent(value)
    }
  }

  const result: ParsedAzureUrl = {
    apiVersion: params["api-version"],
    otherParams: {},
  }

  // Copy other query parameters
  for (const [key, value] of Object.entries(params)) {
    if (key !== "api-version") {
      result.otherParams![key] = value
    }
  }

  // Parse path
  let currentIndex = 0
  if (
    pathParts[currentIndex] === "subscriptions" &&
    pathParts[currentIndex + 1]
  ) {
    result.subscriptionId = pathParts[currentIndex + 1]
    currentIndex += 2
  }

  if (
    pathParts[currentIndex] === "resourceGroups" &&
    pathParts[currentIndex + 1]
  ) {
    result.resourceGroupName = pathParts[currentIndex + 1]
    currentIndex += 2
  }

  if (pathParts[currentIndex] === "providers" && pathParts[currentIndex + 1]) {
    result.resourceProviderName = pathParts[currentIndex + 1]
    currentIndex += 2

    // Collect resource types and names
    const types: string[] = []
    const names: string[] = []

    while (currentIndex < pathParts.length) {
      types.push(pathParts[currentIndex])
      currentIndex++

      if (currentIndex < pathParts.length) {
        names.push(pathParts[currentIndex])
        currentIndex++
      }
    }

    if (types.length > 0) result.resourceType = types
    if (names.length > 0) result.name = names
  }

  return result
}

export function generatePowerShellScript(
  request: AzureApiRequest,
  kqlOnly?: boolean,
): string {
  const { ...filteredHeaders } = request.requestHeaderDetails

  // Special handling for Resource Graph queries
  if (
    request.httpMethod === "POST" &&
    request.url.startsWith("/providers/Microsoft.ResourceGraph")
  ) {
    let script = "#requires -Module Az.ResourceGraph\n\n"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contentQuery = (request.content as any)?.query
    if (typeof contentQuery === "string") {
      let query = contentQuery
      // Replace all pipe characters with newline + pipe
      query = query.replace(/\s*\|\s*/g, "\n| ")
      // Replace leading whitespace/tabs with two spaces
      query = query
        .split("\n")
        .map(line => line.replace(/^\s+/, "  "))
        .join("\n")
      // Trim trailing spaces from each line
      query = query
        .split("\n")
        .map(line => line.trimEnd())
        .join("\n")
      if (kqlOnly) return query

      script += `$query = @'\n${query}\n'@\n\n`
      script += "Search-AzGraph -Query $query"
      return script
    }
  }

  const isFullUrl = request.url.startsWith("https://")
  const parsedUrl = !isFullUrl ? parseAzureUrl(request.url) : null

  const useParameterFormat =
    parsedUrl &&
    parsedUrl.apiVersion &&
    (request.httpMethod !== "GET" ||
      Object.keys(parsedUrl.otherParams || {}).length === 0)

  if (useParameterFormat && parsedUrl) {
    let script = "$armParams = @{\n"

    if (parsedUrl.subscriptionId)
      script += `${indent}SubscriptionId = '${parsedUrl.subscriptionId}'\n`
    if (parsedUrl.resourceGroupName)
      script += `${indent}ResourceGroupName = '${parsedUrl.resourceGroupName}'\n`
    if (parsedUrl.resourceProviderName)
      script += `${indent}ResourceProviderName = '${parsedUrl.resourceProviderName}'\n`
    if (parsedUrl.resourceType)
      script += `${indent}ResourceType = '${parsedUrl.resourceType.join("'/'")}\n'`
    if (parsedUrl.name)
      script += `${indent}Name = '${parsedUrl.name.join("'/'")}\n'`
    script += `${indent}ApiVersion = '${parsedUrl.apiVersion}'\n`
    if (request.httpMethod !== "GET")
      script += `${indent}Method = '${request.httpMethod}'\n`

    if (request.content) {
      script += `${indent}Payload = @'\n${JSON.stringify(request.content, null, 2)}\n'@\n`
    }

    script += "}\n\n"
    script += "Invoke-AzRestMethod @armParams"
    return script
  } else {
    // Fall back to original parameter hashtable format
    const params = {
      Method: request.httpMethod,
      [isFullUrl ? "Uri" : "Path"]: request.url,
      Headers: filteredHeaders,
      Payload: request.content
        ? JSON.stringify(request.content, null, 2)
        : null,
    }

    let script = "$armParams = @{\n"
    script += `${indent}Method = '${params.Method}'\n`
    script += `${indent}${isFullUrl ? "Uri" : "Path"} = '${isFullUrl ? params.Uri : params.Path}'\n`

    if (Object.keys(params.Headers).length > 0) {
      script += `${indent}Headers = @{\n`
      for (const [key, value] of Object.entries(params.Headers)) {
        script += `${indent}${indent}'${key}' = '${value}'\n`
      }
      script += `${indent}}\n`
    }

    if (params.Payload) {
      script += `${indent}Payload = @'\n${params.Payload}\n'@\n`
    }

    script += "}\n"
    script += "Invoke-AzRestMethod @armParams"

    return script
  }
}

export function generateArqPortalUrl(query: string): string {
  const encodedQuery = encodeURIComponent(query)
  return `https://portal.azure.com/?feature.customportal=false#blade/HubsExtension/ArgQueryBlade/query/${encodedQuery}`
}
