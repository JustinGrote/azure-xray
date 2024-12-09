import { CodeHighlightTabs, CodeHighlightTabsCode } from "@mantine/code-highlight";
import { Button, MantineProvider } from "@mantine/core";
import icon from "/assets/icon.png";
import kustoIcon from "/assets/kusto.svg";
import pwshIcon from "/assets/pwsh_logo.svg";
import { clsx } from "clsx";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { useEffect, useMemo, useState } from "react";
import { FaChevronRight } from "react-icons/fa6";
import classes from "./datatable.module.css";
import { getAzureIcon } from "./lib/azureIconMap";
import { formatKqlQuery, parseAzureApiRequest } from "./lib/requestParser";
import { generateArqPortalUrl, generatePowerShellScript } from "./lib/scriptGenerator";
import { AzureApiBatchRequest, AzureCommand } from "./lib/types";


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
        // noop
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

        const provider = apiRequest.resourceId.provider!
        const resourceType = apiRequest.resourceId.resourceType!
        let resourceIcon = undefined
        if (!provider && !resourceType) {
          if (!apiRequest.resourceId.resourceGroup) {
            if (apiRequest.resourceId.subscriptionId) {
              resourceIcon = getAzureIcon(
                "Microsoft.Resources",
                "subscriptions",
              )
            }
          } else {
            resourceIcon = getAzureIcon(
              "Microsoft.Resources",
              "subscriptions/resourceGroups",
            )
          }
        } else {
          resourceIcon = getAzureIcon(provider, resourceType)
        }

        return (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "right",
              width: "100%",
            }}
          >
            <FaChevronRight
              className={clsx(classes.expandIcon, {
                [classes.expandIconRotated]: expandedRecordIds.includes(id),
              })}
            />
            {resourceIcon ? resourceIcon : <span style={{ height: "16px" }} />}

            <span style={{ width: "3ch" }}>{id}</span>
          </div>
        )
      },
      width: "10ch",
      resizable: false,
      textAlign: "right",
      noWrap: true,
      toggleable: false,
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
      resizable: true,
      ellipsis: true,
    },
    {
      accessor: "resourceId.name",
      title: "Resource Name",
      render: apiRequest => {
        const { provider, resourceType } = apiRequest.resourceId
        if (apiRequest.resourceId.name) {
          return apiRequest.resourceId.name
        }

        if (
          provider === "Microsoft.ResourceGraph" &&
          resourceType === "resources"
        ) {
          return <i>Resource Graph Query</i>
        }
        if (provider && !resourceType) {
          return <i>List {provider}</i>
        }
        if (provider && resourceType) {
          return <i>List {resourceType}</i>
        }
      },
    },
    {
      accessor: "resourceId.resourceGroup",
      title: "Resource Group",
    },
    {
      accessor: "resourceId.subscriptionId",
      title: "Subscription",
    },
    {
      accessor: "resourceId.provider",
      title: "Resource Provider",
    },
    {
      accessor: "resourceId.resourceType",
      title: "Type",
    },
  ]

  // const { effectiveColumns } = useDataTableColumns({
  //   key: "azurexray_columns",
  //   columns,
  // })

  const table = (
    <DataTable
      records={records}
      columns={columns}
      defaultColumnProps={{
        ellipsis: true,
        resizable: true,
        // draggable: true,
        // toggleable: true,
      }}
      borderColor="#5E5E5E"
      highlightOnHover
      idAccessor={apiRequest => records.indexOf(apiRequest) + 1}
      pinFirstColumn={true}
      rowBorderColor="#5E5E5E"
      // storeColumnsKey="azurexray_resize"
      striped
      verticalAlign="top"
      withColumnBorders
      withRowBorders={false}
      styles={{
        table: {
          tableLayout: "auto",
        },
        header: {
          backgroundColor: "#333333",
        },
      }}
      scrollAreaProps={{
        type: "hover",
      }}
      rowExpansion={{
        allowMultiple: true,
        expanded: {
          recordIds: expandedRecordIds,
          onRecordIdsChange: setExpandedRecordIds,
        },
        content: ({ record: apiRequest }) => {
          const code = getCodeHighlightDetails(apiRequest)
          return (
            <>
              <div>{apiRequest.url.toString()}</div>
              <CodeHighlightTabs
                code={code}
                withExpandButton
                defaultExpanded={code[0].code.split("\n").length < 13}
              />
            </>
          )
        },
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
        {/* <Button size="xs" variant="subtle" onClick={() => resetColumnsToggle()}>
          Reset View
        </Button> */}
        {/* <Button size="xs" variant="subtle" onClick={() => resetColumnsWidth()}>
          Reset Column Width
        </Button> */}
        {/* <Button size="xs" variant="subtle" onClick={() => resetColumnsOrder()}>
          Reset Column Order
        </Button> */}
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
    command.url.pathname.startsWith("/providers/Microsoft.ResourceGraph")

  if (isResourceGraphQuery) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contentQuery = (command.content as any)?.query
    if (typeof contentQuery === "string") {
      const formattedQuery = formatKqlQuery(contentQuery)
      codeTabs.unshift({
        code: formatKqlQuery(formattedQuery),
        fileName: "Kusto (KQL)",
        language: "sql",
        icon: (
          <a
            href={generateArqPortalUrl(formatKqlQuery(formattedQuery))}
            target="_blank"
          >
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