// import pwshLogo from "url:~/images/pwsh_logo.svg"

// Added directly to index.html as workaround. DONT FORGET TO UPDATE THIS IF UPGRADING VERSIONS!
// import "highlight.js/styles/github.css";

import { createTheme, MantineProvider, type MantineTheme } from "@mantine/core"
import { useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import icon from "url:~/assets/icon.png"

import { DataTable } from "~node_modules/mantine-datatable/dist"
import type { AzureApiRequest, AzureApiRequests } from "~src/lib/types"

// Core theming for mantine
import "@mantine/core/styles.css"

const AzureXrayPanel = () => {
  // Latest edge only supports default and dark
  const mantineThemeColorSchemeName = useMemo(
    () => (chrome.devtools.panels.themeName === "default" ? "light" : "dark"),
    []
  )
  console.log("Devtools Theme Name is", chrome.devtools.panels.themeName)
  console.log("Panel Mantine Theme selected:", mantineThemeColorSchemeName)

  // // Apply dark theme immediately when component mounts
  // document.body.style.backgroundColor = theme.palette.background.default
  // document.body.style.color = theme.palette.text.primary
  document.body.style.margin = "0" // Remove default margin

  const [data, setData] = useState<AzureApiRequest[]>([])

  useEffect(() => {
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
          "Azure X-Ray request detected: %s %s %s",
          requestItem.httpMethod,
          requestItem.requestHeaderDetails.commandName,
          requestItem.url
        )
        setData((currentData) => [...currentData, requestItem])
      })
    }

    chrome.devtools.network.onRequestFinished.addListener(handleRequestFinished)

    return () => {
      chrome.devtools.network.onRequestFinished.removeListener(
        handleRequestFinished
      )
    }
  }, [])

  const columns = [
    {
      accessor: "method",
      title: "Method"
    },
    {
      accessor: "requestHeaderDetails.commandName",
      title: "Name"
    },
    {
      accessor: "url",
      title: "Url"
    }
  ]

  return (
    <MantineProvider defaultColorScheme={mantineThemeColorSchemeName}>
      <div style={{ minHeight: "100vh" }}>
        <div
          id="header"
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
        <div id="xrayRequestsTable">
          <DataTable withTableBorder records={data} columns={columns} />
        </div>
      </div>
    </MantineProvider>
  )
}

createRoot(document.getElementById("root")).render(<AzureXrayPanel />)
