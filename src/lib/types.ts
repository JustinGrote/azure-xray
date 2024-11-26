export interface AzureApiRequest {
  httpMethod: string
  name: string
  requestHeaderDetails: AzureApiRequestHeaderDetails
  url: string
  content?: unknown
}

export interface AzureCommand extends AzureApiRequest {
  resourceId: AzureResourceId
  apiVersion: string
  queryParams?: URLSearchParams
}

export interface AzureResourceGraphQuery extends AzureCommand {
  query: string
}

export interface AzureApiRequestHeaderDetails {
  commandName: string
}

export interface AzureApiBatchRequest {
  requests: AzureApiRequest[]
}

export interface AzureResourceId {
  subscriptionId?: string
  resourceGroupName?: string
  provider?: string
  resourceType?: string
  name?: string
}

