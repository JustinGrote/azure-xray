import {
  AzureApiRequest,
  AzureCommand,
  AzureResourceGraphQuery,
  AzureResourceId,
} from "./types"

export function parseAzureResourceId(url: string): AzureResourceId {
  if (!(url.startsWith("/subscriptions/") || url.startsWith("/providers"))) {
    console.log("Parse Resource URL:", url)
    throw new Error(
      "Invalid Azure Resource ID (doesn't begin with /subscriptions/)",
    )
  }
  const components: AzureResourceId = {}
  // Match subscription ID
  const subMatch = url.match(/\/subscriptions\/([^/?]+)/)
  if (subMatch) components.subscriptionId = subMatch[1]

  // Match resource group
  const rgMatch = url.match(/\/resourceGroups\/([^/?]+)/)
  if (rgMatch) components.resourceGroupName = rgMatch[1]

  // Match provider
  const providerMatch = url.match(/\/providers\/([^/?]+)/)
  if (providerMatch) components.provider = providerMatch[1]

  // Match resource type and name
  const resourceMatch = url.match(
    /\/providers\/[^/]+\/([^/]+)\/([^/]+)(?:\/|$)/,
  )
  if (resourceMatch) {
    components.resourceType = resourceMatch[1]
    components.name = resourceMatch[2]
  }
  return components
}

export function extractApiVersion(url: string): [string, URLSearchParams] {
  const urlObj = !url.startsWith("https://")
    ? new URL(url, "https://management.azure.com")
    : new URL(url)
  const params = urlObj.searchParams
  const apiVersion = params.get("api-version")

  if (!apiVersion) {
    throw new Error("No API version found in URL. This is required.")
  }
  params.delete("api-version")
  return [apiVersion, params]
}

export function parseAzureApiRequest(
  request: AzureApiRequest,
): AzureCommand | AzureResourceGraphQuery {
  const [apiVersion, queryParams] = extractApiVersion(request.url)

  const command: AzureCommand = {
    ...request,
    resourceId: parseAzureResourceId(request.url.split("?")[0]),
    queryParams,
    apiVersion,
  }

  // Special handling for Resource Graph queries
  if (
    command.httpMethod === "POST" &&
    command.resourceId.provider === "Microsoft.ResourceGraph"
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kqlQuery = (request.content as any)?.query

    if (typeof kqlQuery !== "string") {
      throw new Error(
        "Detected a ResourceGraph query, but no content was present",
      )
    }

    const rgQuery: AzureResourceGraphQuery = {
      ...command,
      query: kqlQuery,
    }

    return rgQuery
  }

  return command
}

export function formatKqlQuery(query: string): string {
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

  return query
}
