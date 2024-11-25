import {
  CodeHighlightTabs,
  CodeHighlightTabsCode,
} from "@mantine/code-highlight"
import { MantineProvider } from "@mantine/core"
import icon from "/assets/icon.png"
import kustoIcon from "/assets/kusto.svg"
import pwshIcon from "/assets/pwsh_logo.svg"
import { DataTable, DataTableColumn } from "mantine-datatable"
import { useEffect, useMemo, useState } from "react"
import { generatePowerShellScript } from "./lib/scriptGenerator"
import { AzureApiRequest, AzureApiRequests } from "./lib/types"

const AzureXrayPanel = () => {
  // Latest edge only supports default and dark. As of Nov 2024 we can't detect theme changes so this is memoized.
  const mantineThemeColorSchemeName = useMemo(() => {
    // TODO: Media support for side panel
    if (!chrome?.devtools?.panels.themeName) {
      console.warn("Devtools theme name is not available.")
      return "light"
    }
    const mThemeName =
      chrome.devtools?.panels?.themeName === "default" ? "light" : "dark"
    console.log("Panel Mantine Theme selected:", mThemeName)
    return mThemeName
  }, [])

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

  // HACK: Because we aren't allowed to use the clipboard API in the devtools panel even with writeClipboard permission.

  const columns: DataTableColumn<AzureApiRequest>[] = [
    {
      accessor: "id",
      title: "Id",
      render: apiRequest => (
        <>
          <span>{records.indexOf(apiRequest) + 1}</span>
        </>
      ),
      width: "5ch",
      noWrap: true,
    },
    {
      accessor: "httpMethod",
      title: "Method",
      width: "10ch",
    },
    {
      accessor: "requestHeaderDetails.commandName",
      title: "Name",
      ellipsis: true,
      resizable: true,
    },
  ]

  const table = (
    <DataTable
      columns={columns}
      records={records}
      withRowBorders={false}
      withColumnBorders
      striped
      highlightOnHover
      verticalAlign="top"
      styles={{
        header: {
          backgroundColor: "#333333",
        },
      }}
      height="90%"
      width="100%"
      borderColor="#5E5E5E"
      rowBorderColor="#5E5E5E"
      idAccessor={apiRequest => records.indexOf(apiRequest) + 1}
      rowExpansion={{
        allowMultiple: true,
        content: ({ record: apiRequest }) => (
          <CodeHighlightTabs
            code={getCodeHighlightDetails(apiRequest)}
            withExpandButton
            defaultExpanded={false}
          />
        ),
      }}
    />
  )

  return (
    <MantineProvider defaultColorScheme={mantineThemeColorSchemeName}>
      <div
        id="header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          margin: "8px",
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
    </MantineProvider>
  )
}

function getCodeHighlightDetails(
  apiRequest: AzureApiRequest,
): CodeHighlightTabsCode[] {
  const codeTabs: CodeHighlightTabsCode[] = [
    {
      code: generatePowerShellScript(apiRequest),
      fileName: "PowerShell",
      language: "powershell",
      icon: (
        <img
          src={pwshIcon}
          alt="Kusto (KQL)"
          style={{
            cursor: "pointer",
            height: "calc(1rem * var(--mantine-scale)",
            width: "auto",
          }}
        />
      ),
    },
  ]

  const isResourceGraphQuery =
    apiRequest.httpMethod === "POST" &&
    apiRequest.url.startsWith("/providers/Microsoft.ResourceGraph")

  if (isResourceGraphQuery) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contentQuery = (apiRequest.content as any)?.query
    if (typeof contentQuery === "string") {
      codeTabs.unshift({
        code: generatePowerShellScript(apiRequest, true),
        fileName: "Kusto (KQL)",
        language: "sql",
        icon: (
          <img
            src={kustoIcon}
            alt="Kusto (KQL)"
            style={{
              cursor: "pointer",
              height: "calc(1rem * var(--mantine-scale)",
              width: "auto",
            }}
          />
        ),
      })
    }
  }

  return codeTabs
}

export default AzureXrayPanel
