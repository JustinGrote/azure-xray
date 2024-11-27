import {
  AzureApiRawRequest,
  AzureCommand,
  AzureResourceGraphQuery,
  AzureResourceId,
} from "./types"

export function parseAzureResourceId(url: string): AzureResourceId {
  if (!(url.startsWith("/subscriptions") || url.startsWith("/providers"))) {
    console.log("Parse Resource URL:", url)
    throw new Error(
      "Invalid Azure Resource ID (doesn't begin with /subscriptions or /providers)",
    )
  }

  const parts = url
    .split("?")[0]
    .split("/")
    .filter(part => part)

  const resourceId: AzureResourceId = {}

  let index = 0
  while (index < parts.length) {
    switch (parts[index]) {
      case "subscriptions":
        resourceId.subscriptionId = parts[++index]
        break
      case "resourceGroups":
        resourceId.resourceGroup = parts[++index]
        break
      case "providers":
        resourceId.provider = parts[++index]
        if (index + 1 < parts.length) {
          resourceId.resourceType = parts[++index]
          // If there's another part, it's the resource name
          if (index + 1 < parts.length) {
            resourceId.name = parts[++index]
            // If there are more parts, treat them as parent/child resources
            if (index + 1 < parts.length) {
              resourceId.parent = parts.slice(index + 1).join("/")
            }
          }
        }
        break
    }
    index++
  }

  return resourceId
}

export function extractUrlComponents(url: string): [string, URL] {
  const urlObj = !url.startsWith("https://")
    ? new URL(url, "https://management.azure.com")
    : new URL(url)
  const params = urlObj.searchParams
  const apiVersion = params.get("api-version")

  if (!apiVersion) {
    throw new Error("No API version found in URL. This is required.")
  }
  params.delete("api-version")
  return [apiVersion, urlObj]
}

export function parseAzureApiRequest(
  request: AzureApiRawRequest,
): AzureCommand | AzureResourceGraphQuery {
  const [apiVersion, url] = extractUrlComponents(request.url)

  const command: AzureCommand = {
    ...request,
    resourceId: parseAzureResourceId(url.pathname),
    apiVersion,
    url,
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
