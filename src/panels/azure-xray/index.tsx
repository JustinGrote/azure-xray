import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import icon from "url:~/assets/icon.png"
import pwshLogo from "url:~/images/pwsh_logo.svg"
import { Toast } from "../../components/Toast"

import { generatePowerShellScript } from "../../lib/scriptGenerator"

interface AzureApiRequest {
  httpMethod: string
  name: string
  requestHeaderDetails: AzureApiRequestHeaderDetails
  url: string
  content?: unknown
}

interface AzureApiRequestHeaderDetails {
  commandName: string
}

interface AzureApiRequests {
  requests: AzureApiRequest[]
}

const AzureXrayPanel = () => {
  const [reqs, setReq] = useState<AzureApiRequest[]>([])
  const [toast, setToast] = useState<{ message: string, content: string } | null>(null)

  const showPowerShellScript = (request: AzureApiRequest) => {
    const script = generatePowerShellScript(request)
    setToast({
      message: "PowerShell Script Generated",
      content: script
    })
  }

  useEffect(() => {
    // Apply dark theme immediately when component mounts
    document.body.style.backgroundColor = "#282828"
    document.body.style.color = "#e8eaed"
    document.body.style.margin = "0" // Remove default margin

    const handleRequestFinished = (
      traceEntry: chrome.devtools.network.Request
    ) => {
      const url = traceEntry?.request?.url
      if (!url.startsWith("https://management.azure.com/batch")) {
        return
      }
      const reqData: AzureApiRequests = JSON.parse(
        traceEntry?.request?.postData?.text
      )
      if (!reqData?.requests) {
        console.warn(
          "Azure X-Ray request detected but no requests found. Probably a bug",
          url,
          reqData
        )
        return
      }
      const requests = reqData.requests
      requests.forEach((requestItem) => {
        requestItem.url = requestItem.url.replace(
          /^https:\/\/management\.azure\.com/,
          ""
        )
        requestItem.requestHeaderDetails.commandName =
          requestItem.requestHeaderDetails.commandName.replace(/\.$/, "")
        console.log(
          "Azure X-Ray request detected",
          requestItem.httpMethod,
          requestItem.requestHeaderDetails.commandName,
          requestItem.url
        )
        setReq((reqs) => {
          const newReqs = [...reqs, requestItem]
          return newReqs
        })
      })
    }

    chrome.devtools.network.onRequestFinished.addListener(handleRequestFinished)

    return () => {
      chrome.devtools.network.onRequestFinished.removeListener(
        handleRequestFinished
      )
    }
  }, [])

  return (
    <div
      style={{
        backgroundColor: "#282828",
        minHeight: "100vh",
        fontSize: "12px"
      }}>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: "16px"
          }}>
          <img
            src={icon}
            alt="Azure X-Ray"
            style={{ width: "16px", height: "16px" }}
          />
          <h1 style={{ fontSize: "14px", margin: 0 }}>Azure X-Ray</h1>
        </div>
        {reqs && reqs.length > 0 && (
          <div style={{ width: "100%" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: 0
              }}>
              <thead>
                <tr style={{ backgroundColor: "#3c4043", color: "#e8eaed" }}>
                  <th
                    style={{
                      padding: "4px 8px",
                      textAlign: "left",
                      fontSize: "12px",
                      width: "30px"
                    }}></th>
                  <th
                    style={{
                      padding: "4px 8px",
                      textAlign: "left",
                      fontSize: "12px",
                      whiteSpace: "nowrap",
                      borderRight: "1px solid #5E5E5E"
                    }}>
                    Method
                  </th>
                  <th
                    style={{
                      padding: "4px 8px",
                      textAlign: "left",
                      fontSize: "12px",
                      whiteSpace: "nowrap",
                      borderRight: "1px solid #5E5E5E"
                    }}>
                    Command
                  </th>
                  <th
                    style={{
                      padding: "4px 8px",
                      textAlign: "left",
                      fontSize: "12px",
                      whiteSpace: "nowrap"
                    }}>
                    URL
                  </th>
                </tr>
              </thead>
              <tbody>
                {reqs.map((req, index) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#28292A" : "#1F1F1F",
                      color: "#e8eaed"
                    }}>
                    <td style={{ padding: "4px 8px" }}>
                      <button
                        onClick={() => showPowerShellScript(req)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0
                        }}
                        title="Copy as PowerShell Script">
                        <img
                          src={pwshLogo}
                          alt="PowerShell"
                          style={{ width: "16px", height: "16px" }}
                        />
                      </button>
                    </td>
                    <td
                      style={{
                        color: "#e8eaed",
                        padding: "4px 8px",
                        whiteSpace: "nowrap",
                        borderRight: "1px solid #5E5E5E"
                      }}>
                      {req.httpMethod}
                    </td>
                    <td
                      style={{
                        color: "#e8eaed",
                        padding: "4px 8px",
                        whiteSpace: "nowrap",
                        borderRight: "1px solid #5E5E5E"
                      }}>
                      {req.requestHeaderDetails.commandName}
                    </td>
                    <td
                      style={{
                        color: "#e8eaed",
                        padding: "4px 8px",
                        whiteSpace: "nowrap"
                      }}>
                      {req.url}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {toast && (
        <Toast
          message={toast.message}
          content={toast.content}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

createRoot(document.getElementById("root")).render(<AzureXrayPanel />)
