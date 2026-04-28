import mongoose from "mongoose"
import { resolveReportLayout } from "./emcReportLayout"
import {
  applyTemplate
} from "./emcReportTemplate"

// =====================================
// PATH RESOLVER
// =====================================
function emcGetValue(
  obj: any,
  path?: string
) {
  if (!path) return ""

  const parts = path.split(".")
  let current = obj

  for (const part of parts) {
    if (current == null) return ""
    current = current[part]
  }

  return current ?? ""
}

// =====================================
// CONFIG RESOLUTION
// ORG SPECIFIC -> GENERIC
// =====================================
async function emcResolveDefinition(
  db: any,
  payload: any,
  user: any
) {
  let definition = await db
    .collection("emcReportDefinitions")
    .findOne({
      screenId: payload.screenId,
      organizationId:
        user.organizationId,
      isActive: true
    })

  if (definition) return definition

  definition = await db
    .collection("emcReportDefinitions")
    .findOne({
      screenId: payload.screenId,
      organizationId: null,
      isActive: true
    })

  if (definition) return definition

  throw new Error(
    "Report configuration does not exist. Please contact administrator."
  )
}

// =====================================
// SCREEN CONFIG RESOLUTION
// ORG SPECIFIC -> GENERIC
// =====================================
async function emcResolveScreenConfig(
  db: any,
  definition: any,
  payload: any,
  user: any
) {
  const col =
    definition.configSource
      .collection

  const field =
    definition.configSource
      .findByField

  let config = await db
    .collection(col)
    .findOne({
      [field]:
        payload.screenId,
      organizationId:
        user.organizationId
    })

  if (config) return config

  config = await db
    .collection(col)
    .findOne({
      [field]:
        payload.screenId,
      organizationId: null
    })

  if (config) return config

  throw new Error(
    "Screen configuration does not exist. Please contact administrator."
  )
}

// =====================================
// TABLE RENDERER
// =====================================
function emcBuildTable(
  columns: any[],
  rows: any[]
) {
  const head = `
    <tr>
      ${columns.map(col => `
        <th style="
          width:${col.width}%;
          text-align:left;
        ">
          ${col.label}
        </th>
      `).join("")}
    </tr>
  `

  const body = rows.map(row => `
    <tr>
      ${columns.map(col => `
        <td>
          ${emcGetValue(
    row,
    col.field
  )}
        </td>
      `).join("")}
    </tr>
  `).join("")

  return `
    <table>
      <thead>${head}</thead>
      <tbody>${body}</tbody>
    </table>
  `
}

// =====================================
// MAIN ENGINE
// =====================================
export async function emcRunGenericReport(
  payload: any,
  user: any
) {
  const db =
    mongoose.connection.db

  // -------------------------
  // 1. Resolve Definition
  // -------------------------
  const definition =
    await emcResolveDefinition(
      db,
      payload,
      user
    )

  // -------------------------
  // 2. Resolve Screen Config
  // -------------------------
  const screenConfig =
    await emcResolveScreenConfig(
      db,
      definition,
      payload,
      user
    )

  // -------------------------
  // 3. Read Title / Columns
  // -------------------------
  const title =
    emcGetValue(
      screenConfig,
      definition.schemaMap.title
    ) || payload.screenId

  const rawColumns =
    emcGetValue(
      screenConfig,
      definition.schemaMap.columns
    ) || []

  const columns = rawColumns.map(
    (col: any) => ({
      label:
        col[
        definition.schemaMap
          .columnLabel
        ],
      field:
        col[
        definition.schemaMap
          .columnField
        ],
      width: Number(
        col[
        definition.schemaMap
          .columnWidth
        ] || 10
      )
    })
  )

  // -------------------------
  // 4. Data Source
  // -------------------------
  let dataCollection =
    payload.collection

  if (
    definition.dataSource.mode ===
    "payload"
  ) {
    dataCollection =
      payload[
      definition.dataSource
        .collectionField
      ]
  }

  if (!dataCollection) {
    throw new Error(
      "Data collection missing."
    )
  }

  // -------------------------
  // 5. Query
  // -------------------------
  const query: any = {}

  const tenantField =
    definition.security
      ?.tenantField

  if (tenantField) {
    query[tenantField] =
      user.organizationId
  }

  Object.assign(
    query,
    payload.filters || {}
  )

  const maxRows =
    definition.limits
      ?.maxRows || 1000

  const rows = await db
    .collection(dataCollection)
    .find(query)
    .limit(maxRows)
    .toArray()

  // -------------------------
  // 6. Table HTML
  // -------------------------
  const tableHtml =
    emcBuildTable(
      columns,
      rows
    )

  // -------------------------
  // 7. Layout
  // -------------------------
  const layout =
    await resolveReportLayout(
      definition,
      user
    )

  const organization =
    user.organization ||
    user.organizationDetails ||
    {}

  const context = {
    companyName:
      organization.name ||
      organization.Name ||
      organization.code ||
      organization.Code ||
      user.organizationName ||
      "Your Company",

    companyLogo:
      organization.logo ||
      organization.Logo ||
      user.organizationLogo ||
      user.companyLogo ||
      "",

    reportTitle: title,

    reportSubtitle:
      payload.subtitle || "",

    generatedAt:
      new Date().toLocaleString()
  }

  const headerHtml =
    applyTemplate(
      layout.header,
      context
    )

  const bodyHtml =
    applyTemplate(
      layout.body,
      context
    ).replace(
      "{{TABLE}}",
      tableHtml
    )

  const footerHtml =
    applyTemplate(
      layout.footer,
      context
    )

  // -------------------------
  // 8. Final HTML
  // -------------------------
  const html = `
<html>
<head>
  <title>${title}</title>

  <style>
    @page{
      size:A4;
      margin:10mm;
    }

    body{
      margin:0;
      font-family:Arial,sans-serif;
      background:#f5f5f5;
      color:#000;
    }

    .report-toolbar{
      position:sticky;
      top:0;
      z-index:999;
      background:#ffffff;
      border-bottom:1px solid #ddd;
      padding:10px 16px;
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:10px;
    }

    .toolbar-title{
      font-size:16px;
      font-weight:700;
    }

    .toolbar-actions{
      display:flex;
      gap:10px;
      flex-wrap:wrap;
    }

    .toolbar-actions button{
      border:none;
      padding:9px 14px;
      border-radius:6px;
      color:#fff;
      cursor:pointer;
      font-size:13px;
      font-weight:600;
    }

    .btn-print{
      background:#1976d2;
    }

    .btn-excel{
      background:#2e7d32;
    }

    .btn-pdf{
      background:#c62828;
    }

    .btn-csv{
      background:#6d4c41;
    }

    .toolbar-actions button:hover{
      opacity:.9;
    }

    .report-wrapper{
      padding:16px;
    }

    .report-page{
      width:190mm;
      margin:0 auto;
      background:#fff;
      padding:10mm;
      box-shadow:0 2px 8px rgba(0,0,0,.08);
      box-sizing:border-box;
    }

    .report-header{
      margin-bottom:10px;
    }

    .report-body{
      margin-top:8px;
    }

    .report-footer{
      margin-top:25px;
    }

    table{
      width:100%;
      border-collapse:collapse;
    }

    th{
      background:#f2f2f2;
      border:1px solid #999;
      padding:6px;
      text-align:left;
    }

    td{
      border:1px solid #ccc;
      padding:6px;
      vertical-align:top;
    }

    @media print{
      .report-toolbar{
        display:none;
      }

      .report-wrapper{
        padding:0;
      }

      .report-page{
        width:auto;
        margin:0;
        box-shadow:none;
        padding:0;
      }

      body{
        background:#fff;
      }
    }

    ${layout.css}
  </style>

  <script>
    window.emcPayload =
      ${JSON.stringify(payload)};

    async function emcExport(format){
      try{
        const response = await fetch(
          '/api/report/emcGenericReport',
          {
            method:'POST',
            headers:{
              'Content-Type':'application/json'
            },
            body: JSON.stringify({
              ...window.emcPayload,
              format
            })
          }
        );

        const blob =
          await response.blob();

        const ext =
          format === 'PDF'
            ? 'pdf'
            : format === 'CSV'
              ? 'csv'
              : 'xlsx';

        const link =
          document.createElement('a');

        link.href =
          URL.createObjectURL(blob);

        link.download =
          '${title.replace(/'/g, "")}.' + ext;

        document.body.appendChild(link);
        link.click();
        link.remove();

      }catch(err){
        alert(
          'Export failed'
        );
      }
    }
  </script>
</head>

<body>

  <div class="report-toolbar">

    <div class="toolbar-title">
      ${title}
    </div>

    <div class="toolbar-actions">

      <button
        class="btn-print"
        onclick="window.print()">
        🖨 Print
      </button>

      <button
        class="btn-excel"
        onclick="emcExport('EXCEL')">
        📗 Excel
      </button>

      <button
        class="btn-pdf"
        onclick="emcExport('PDF')">
        📕 PDF
      </button>

      <button
        class="btn-csv"
        onclick="emcExport('CSV')">
        📄 CSV
      </button>

    </div>

  </div>

  <div class="report-wrapper">
    <div class="report-page">

      <div class="report-header">
        ${headerHtml}
      </div>

      <div class="report-body">
        ${bodyHtml}
      </div>

      <div class="report-footer">
        ${footerHtml}
      </div>

    </div>
  </div>

</body>
</html>
`

  // -------------------------
  // 9. Audit
  // -------------------------
  await db
    .collection(
      "emcReportAudit"
    )
    .insertOne({
      screenId:
        payload.screenId,
      definitionId:
        definition._id,
      organizationId:
        user.organizationId,
      userId: user.id,
      rowCount: rows.length,
      format:
        payload.format ||
        "HTML",
      createdAt: new Date()
    })

  return html
}
