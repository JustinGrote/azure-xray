export interface AzureApiRawRequest {
  httpMethod: string
  name: string
  requestHeaderDetails: AzureApiRequestHeaderDetails
  url: string
  content?: unknown
}

export interface AzureCommand extends Omit<AzureApiRawRequest, "url"> {
  resourceId: AzureResourceId
  apiVersion: string
  // API version will be stripped from the URL
  url: URL
}

export interface AzureResourceGraphQuery extends AzureCommand {
  query: string
}

export interface AzureApiRequestHeaderDetails {
  commandName: string
}

export interface AzureApiBatchRequest {
  requests: AzureApiRawRequest[]
}

export interface AzureResourceId {
  subscriptionId?: string
  resourceGroup?: string
  provider?: string
  resourceType?: string
  name?: string
  parent?: string
}
