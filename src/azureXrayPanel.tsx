import { CodeHighlightTabs, CodeHighlightTabsCode } from "@mantine/code-highlight";
import { Button, Group, MantineProvider } from "@mantine/core"
import icon from "/assets/icon.png"
import kustoIcon from "/assets/kusto.svg"
import pwshIcon from "/assets/pwsh_logo.svg"
import { clsx } from "clsx"
import {
  DataTable,
  DataTableColumn,
  useDataTableColumns,
} from "mantine-datatable"
import { useEffect, useMemo, useState } from "react"
import { FaChevronRight } from "react-icons/fa6"
import classes from "./datatable.module.css"
import { formatKqlQuery, parseAzureApiRequest } from "./lib/requestParser"
import {
  generateArqPortalUrl,
  generatePowerShellScript,
} from "./lib/scriptGenerator"
import { AzureApiBatchRequest, AzureCommand } from "./lib/types"

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

  const [records, setRecords] = useState<AzureCommand[]>([])
  const [expandedRecordIds, setExpandedRecordIds] = useState<number[]>([])

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
      const reqData: AzureApiBatchRequest = JSON.parse(postData)
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

        setRecords(currentData => [
          ...currentData,
          parseAzureApiRequest(requestItem),
        ])
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

  const columns: DataTableColumn<AzureCommand>[] = [
    {
      accessor: "id",
      title: "Id",
      render: apiRequest => {
        const id = records.indexOf(apiRequest) + 1
        return (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <FaChevronRight
              className={clsx(classes.expandIcon, {
                [classes.expandIconRotated]: expandedRecordIds.includes(id),
              })}
            />
            <span>{id}</span>
          </div>
        )
      },
      width: "20ch",
      textAlign: "right",
      noWrap: true,
    },
    {
      accessor: "httpMethod",
      title: "Method",
      width: "10ch",
      ellipsis: false,
    },
    {
      accessor: "requestHeaderDetails.commandName",
      title: "Name",
    },
    {
      accessor: "resourceId.name",
      title: "Resource Name",
      render: apiRequest => apiRequest.resourceId.name,
    },
    {
      accessor: "resourceId.resourceGroupName",
      title: "Resource Group",
    },
    {
      accessor: "resourceId.resourceType",
      title: "Type",
    },
    {
      accessor: "resourceId.subscriptionId",
      title: "Subscription",
    },
    {
      accessor: "resourceId.provider",
      title: "Resource Provider",
    },
  ]

  const { effectiveColumns, resetColumnsToggle } = useDataTableColumns({
    key: "azure-xray",
    columns,
  })

  const table = (
    <DataTable
      defaultColumnProps={{
        ellipsis: true,
        resizable: true,
        draggable: true,
        toggleable: true,
      }}
      columns={effectiveColumns}
      records={records}
      withRowBorders={false}
      withColumnBorders
      striped
      highlightOnHover
      verticalAlign="top"
      styles={{
        table: {
          tableLayout: "fixed",
        },
        header: {
          backgroundColor: "#333333",
        },
      }}
      height="90%"
      width="100%"
      borderColor="#5E5E5E"
      rowBorderColor="#5E5E5E"
      scrollAreaProps={{
        type: "hover",
      }}
      idAccessor={apiRequest => records.indexOf(apiRequest) + 1}
      rowExpansion={{
        allowMultiple: true,
        expanded: {
          recordIds: expandedRecordIds,
          onRecordIdsChange: setExpandedRecordIds,
        },
        content: ({ record: apiRequest }) => (
          <>
            <div>{apiRequest.url}</div>
            <CodeHighlightTabs
              code={getCodeHighlightDetails(apiRequest)}
              withExpandButton
              defaultExpanded={false}
            />
          </>
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
        <div style={{ flexGrow: 1 }} />
        <Button size="xs" variant="subtle" onClick={() => setRecords([])}>
          Clear
        </Button>
        <Button size="xs" variant="subtle" onClick={() => resetColumnsToggle()}>
          Reset View
        </Button>
      </div>
      <div id="xrayRequestsTable">{table}</div>
    </MantineProvider>
  )
}

function getCodeHighlightDetails(
  command: AzureCommand,
): CodeHighlightTabsCode[] {
  const codeTabs: CodeHighlightTabsCode[] = [
    {
      code: generatePowerShellScript(command),
      fileName: "PowerShell",
      language: "powershell",
      icon: (
        <img
          src={pwshIcon}
          alt="Kusto (KQL)"
          style={{
            height: "calc(1rem * var(--mantine-scale)",
          }}
        />
      ),
    },
  ]

  const isResourceGraphQuery =
    command.httpMethod === "POST" &&
    command.url.startsWith("/providers/Microsoft.ResourceGraph")

  if (isResourceGraphQuery) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contentQuery = (command.content as any)?.query
    if (typeof contentQuery === "string") {
      codeTabs.unshift({
        code: formatKqlQuery(contentQuery),
        fileName: "Kusto (KQL)",
        language: "sql",
        icon: (
          <a href={generateArqPortalUrl(contentQuery)} target="_blank">
            <img
              src={kustoIcon}
              alt="Kusto (KQL)"
              style={{
                height: "calc(1rem * var(--mantine-scale)",
              }}
            />
          </a>
        ),
      })
    }
  }

  return codeTabs
}

export default AzureXrayPanel