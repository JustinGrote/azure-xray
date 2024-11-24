import { CodeHighlight } from "@mantine/code-highlight"
import { MantineProvider } from "@mantine/core"
import "@mantine/core/styles.css"
import "highlight.js/styles/github.css"
import { DataTable, DataTableColumn } from "mantine-datatable"
import { useEffect, useMemo, useState } from "react"
import { generatePowerShellScript } from "./lib/scriptGenerator"
import { AzureApiRequest, AzureApiRequests } from "./lib/types"
import icon from "/assets/icon.png"

const AzureXrayPanel = () => {
  // Latest edge only supports default and dark. As of Nov 2024 we can't detect theme changes so this is memoized.
  const mantineThemeColorSchemeName = useMemo(
    () => (chrome.devtools.panels.themeName === "default" ? "light" : "dark"),
    [],
  )
  console.log("Devtools Theme Name is", chrome.devtools.panels.themeName)
  console.log("Panel Mantine Theme selected:", mantineThemeColorSchemeName)

  const [records, setRecords] = useState<AzureApiRequest[]>([])

  useEffect(() => {
    const handleRequestFinished = (
      traceEntry: chrome.devtools.network.Request,
    ) => {
      const url = traceEntry?.request?.url
      if (!url.startsWith("https://management.azure.com/batch")) {
        return
      }
      const postData = traceEntry?.request?.postData?.text
      if (!postData) {
        console.warn(
          "Azure X-Ray request detected but no requests found. Probably a bug",
          url,
        )
        return
      }
      const reqData: AzureApiRequests = JSON.parse(postData)
      const requests = reqData.requests
      requests.forEach(requestItem => {
        requestItem.url = requestItem.url.replace(
          /^https:\/\/management\.azure\.com/,
          "",
        )
        requestItem.requestHeaderDetails.commandName =
          requestItem.requestHeaderDetails.commandName.replace(/\.$/, "")
        console.log(
          "Azure X-Ray request detected: %s %s %s",
          requestItem.httpMethod,
          requestItem.requestHeaderDetails.commandName,
          requestItem.url,
        )
        setRecords(currentData => [...currentData, requestItem])
      })
    }

    chrome.devtools.network.onRequestFinished.addListener(handleRequestFinished)

    return () => {
      chrome.devtools.network.onRequestFinished.removeListener(
        handleRequestFinished,
      )
    }
  }, [])

  const columns: DataTableColumn<AzureApiRequest>[] = [
    {
      accessor: "id",
      title: "Id",
      render: apiRequest => (
        <>
          <span>{records.indexOf(apiRequest) + 1}</span>
        </>
      ),
      width: "6ch",
      noWrap: true,
    },
    {
      accessor: "httpMethod",
      title: "Method",
      width: "9ch",
    },
    {
      accessor: "requestHeaderDetails",
      title: "Name",
      render: ({ requestHeaderDetails }) => (
        <div
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "70ch",
          }}
        >
          {requestHeaderDetails.commandName}
        </div>
      ),
    },
    {
      accessor: "url",
      title: "Url",
      render: ({ url }) => (
        <div
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {url}
        </div>
      ),
    },
  ]

  const table = DataTable({
    columns,
    records,
    withColumnBorders: true,
    verticalAlign: "top",
    // bodyRef: useAutoAnimate<HTMLTableSectionElement>()[0],
    styles: {
      header: {
        backgroundColor: "#333333",
      },
    },
    height: "90%",
    borderColor: "#5E5E5E",
    rowBorderColor: "#5E5E5E",
    idAccessor: apiRequest => records.indexOf(apiRequest) + 1,
    rowExpansion: {
      allowMultiple: true,
      content: ({ record: apiRequest }) => (
        <CodeHighlight
          code={generatePowerShellScript(apiRequest)}
          language="powershell"
        />
      ),
    },
  })

  return (
    <MantineProvider defaultColorScheme={mantineThemeColorSchemeName}>
      <div style={{ minHeight: "100vh" }}>
        <div
          id="header"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: "16px",
          }}
        >
          <img
            src={icon}
            alt="Azure X-Ray"
            style={{ width: "16px", height: "16px" }}
          />
          <h1 style={{ fontSize: "14px", margin: 0 }}>Azure X-Ray</h1>
        </div>
        <div id="xrayRequestsTable">{table}</div>
      </div>
    </MantineProvider>
  )
}

export default AzureXrayPanel
