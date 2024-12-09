import { Image } from "@mantine/core"
import iconAzureDeployments from "../../assets/azure-deployments.svg"
import iconDefault from "../../assets/azure-resource.svg"
import iconAzureResourceProvider from "../../assets/azure-resourceprovider.svg"
import iconAzureTag from "../../assets/azure-tag.svg"
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
  const iconContent = getAzureIconContent(iconKey)
  return <Image src={iconContent} alt={iconKey} h={16} />
}

function getAzureIconKey(provider: string, resourceType: string): string {
  if (provider && !resourceType) {
    return provider
  }
  let azureIconKey = `${provider}/${resourceType}`.toLowerCase()
  switch (azureIconKey) {
    case "microsoft.resourcegraph/resources":
      azureIconKey = "microsoft.resourcegraph/queries"
      break
  }

  return azureIconKey
}

function getAzureIconContent(iconKey: string) {
  // If the icon key is a simple provider name, return the default provider icon
  if (!iconKey.includes("/")) {
    return iconAzureResourceProvider
  }
  if (iconKey === "microsoft.resources/tags") {
    return iconAzureTag
  }
  if (iconKey === "microsoft.resources/deployments") {
    return iconAzureDeployments
  }

  const embeddedIcon = azureIconMap[iconKey]

  return embeddedIcon
    ? `data:image/svg+xml;base64,${btoa(embeddedIcon)}`
    : iconDefault
}
