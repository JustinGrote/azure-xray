import { createRoot } from "react-dom/client"
import { useEffect, useState } from "react"

interface AzureApiRequest {
  httpMethod: string;
  name: string;
	requestHeaderDetails: AzureApiRequestHeaderDetails
  url: string;
}

interface AzureApiRequestHeaderDetails {
	commandName: string;
}

interface AzureApiRequests {
	requests: AzureApiRequest[];
}

const AzureXrayPanel = () => {
	const [reqs, setReq] = useState<AzureApiRequest[]>([])
	useEffect(() => {
		// Apply dark theme immediately when component mounts
		document.body.style.backgroundColor = '#202124';
		document.body.style.color = '#e8eaed';
		document.body.style.margin = '0';  // Remove default margin

		const handleRequestFinished = (traceEntry: chrome.devtools.network.Request) => {
			const url = traceEntry?.request?.url
			if (!url.startsWith("https://management.azure.com/batch")) {return}
			const reqData:AzureApiRequests = JSON.parse(traceEntry?.request?.postData?.text)
			if (!reqData?.requests) {
				console.warn("Azure X-Ray request detected but no requests found. Probably a bug", url, reqData)
				return
			}
			const requests = reqData.requests
			requests.forEach((requestItem) => {
				requestItem.url = requestItem.url.replace(/^https:\/\/management\.azure\.com/, "");
				console.log("Azure X-Ray request detected", requestItem.httpMethod, requestItem.requestHeaderDetails.commandName, requestItem.url)
				setReq(reqs => {
					const newReqs = [...reqs, requestItem];
					return newReqs;
				})
			})
		};

		chrome.devtools.network.onRequestFinished.addListener(handleRequestFinished);

		return () => {
			chrome.devtools.network.onRequestFinished.removeListener(handleRequestFinished);
		};
	}, []);

	return (
			<div style={{
				backgroundColor: '#202124',
				minHeight: '100vh',
				padding: '16px'
			}}>
			<div>
				<h2>Azure X-Ray</h2>
				{reqs && reqs.length > 0 && (
					<div>
						<h3>Request Details</h3>
						<table style={{ width: '100%', borderCollapse: 'collapse' }}>
							<thead>
								<tr style={{ backgroundColor: '#3c4043', color: '#e8eaed' }}>
									<th style={{ padding: '8px', textAlign: 'left' }}>Method</th>
									<th style={{ padding: '8px', textAlign: 'left' }}>Command</th>
									<th style={{ padding: '8px', textAlign: 'left' }}>URL</th>
								</tr>
							</thead>
							<tbody>
								{reqs.map((req, index) => (
									<tr
										key={index}
										style={{
											backgroundColor: index % 2 === 0 ? '#292a2d' : '#202124',
											color: '#e8eaed',
											borderBottom: '1px solid #3c4043'
										}}
									>
										<td style={{ color: '#e8eaed', padding: '8px' }}>{req.httpMethod}</td>
										<td style={{ color: '#e8eaed', padding: '8px' }}>{req.requestHeaderDetails.commandName}</td>
										<td style={{ color: '#e8eaed', padding: '8px' }}>{req.url}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
};

createRoot(document.getElementById("root")).render(<AzureXrayPanel />)