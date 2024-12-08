import { Image } from "@mantine/core"
import iconData from "../../assets/azureIconMap.json"

type AzureResourceTypeIconMap = Readonly<Record<string, string>>

// Export the typed icon data
export const azureIconMap: AzureResourceTypeIconMap =
  iconData as AzureResourceTypeIconMap

export function getAzureIcon(
  provider: string,
  resourceType: string,
): JSX.Element | undefined {
  const iconKey = getAzureIconKey(provider, resourceType)
  const iconContent = azureIconMap[iconKey]
  if (!iconContent) {
    return undefined
  }

  return (
    <Image
      src={`data:image/svg+xml;base64,${btoa(iconContent)}`}
      alt={iconKey}
      h={16}
    />
  )
}

export function getAzureIconKey(
  provider: string,
  resourceType: string,
): string {
  let azureIconKey = `${provider}/${resourceType}`.toLowerCase()
  switch (azureIconKey) {
    case "microsoft.resourcegraph/resources":
      azureIconKey = "microsoft.resourcegraph/queries"
      break
  }

  return azureIconKey
}
