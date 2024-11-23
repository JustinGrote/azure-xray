export interface AzureApiRequest {
    httpMethod: string;
    name: string;
    requestHeaderDetails: AzureApiRequestHeaderDetails
    url: string;
    content?: unknown;
}

export interface AzureApiRequestHeaderDetails {
    commandName: string;
}

export interface AzureApiRequests {
    requests: AzureApiRequest[];
}
