import mongoose from "mongoose"
import { emcReportHandlers } from "./emcReportHandlers"
import {
  ALLOWED_COLLECTIONS,
  validatePipeline
} from "./emcReportSecurity"
import {
  applyTemplate,
  renderTemplateRows
} from "./emcReportTemplate"

import { resolveReportLayout } from "./emcReportLayout"

// ================= PARAM INJECTION =================
function injectParams(obj: any, params: any, key?: string): any {
  if (typeof obj === "string") {
    const match = obj.match(/^\{\{(.+?)\}\}$/)

    if (match) {
      const value = params[match[1]]

      if (
        typeof value === "string" &&
        (key === "_id" || key?.endsWith("Id"))
      ) {
        if (mongoose.Types.ObjectId.isValid(value)) {
          return new mongoose.Types.ObjectId(value)
        }
      }

      return value
    }

    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(i => injectParams(i, params, key))
  }

  if (typeof obj === "object" && obj !== null) {
    const result: any = {}

    for (const childKey in obj) {
      result[childKey] = injectParams(obj[childKey], params, childKey)
    }

    return result
  }

  return obj
}

// ================= DATA SOURCE =================
async function executeMongoSource(report: any, params: any, user: any) {
  const { collection, pipeline } = report.dataSource

  if (!ALLOWED_COLLECTIONS.includes(collection)) {
    // throw new Error("Collection not allowed")
  }
  params.organizationId = user.organizationId
  let finalPipeline = injectParams(pipeline, params)
  // finalPipeline = injectParams(finalPipeline, user.organizationId)

  finalPipeline.unshift({
    $match: { organizationId: user.organizationId }
  })

  validatePipeline(finalPipeline)

  finalPipeline.push({ $limit: 1000 })

  const db = mongoose.connection.db

  return await db
    .collection(collection)
    .aggregate(finalPipeline, { maxTimeMS: 5000 })
    .toArray()
}

async function executeHandler(report: any, params: any, user: any) {
  const handler = emcReportHandlers[report.dataSource.handler]

  if (!handler) throw new Error("Handler not found")

  return await handler(params, user)
}

// ================= HTML =================
async function generateHTML(
  report: any,
  data: any,
  user: any
) {
  const layout = await resolveReportLayout(report, user)

  const firstRow = {
    ...(data?.[0] || {}),

    companyName:
      user.organization.Name ||
      report?.branding?.companyName ||
      user?.organizationName ||
      "Your Company",

    companyLogo:
      report?.branding?.logo ||
      user?.companyLogo ||
      "",

    generatedAt: new Date().toLocaleString()
  }

  const headerHtml = applyTemplate(
    layout.header,
    firstRow
  )

  const bodyHtml = renderTemplateRows(
    layout.body,
    data,
    report
  )

  const footerHtml = applyTemplate(
    layout.footer,
    firstRow
  )

  return `
    <html>
      <head>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            width: 190mm;
            margin: 10mm auto;
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #000;
            line-height: 1.4;
            background: #fff;
          }

          .page {
            width: 100%;
          }

          .report-header {
            margin-bottom: 10px;
          }

          .report-body {
            margin-top: 8px;
          }

          .report-footer {
            margin-top: 25px;
            border-top: 1px solid #000;
            padding-top: 8px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          thead {
            display: table-header-group;
          }

          tr {
            page-break-inside: avoid;
          }

          th {
            background: #f2f2f2;
            border: 1px solid #999;
            padding: 6px;
            font-weight: bold;
          }

          td {
            border: 1px solid #ccc;
            padding: 6px;
            vertical-align: top;
          }

          .text-left {
            text-align: left;
          }

          .text-center {
            text-align: center;
          }

          .text-right {
            text-align: right;
          }

          ${layout.css}
        </style>
      </head>

      <body>
        <div class="page">

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
      </body>
    </html>
  `
}

import { htmlToPdf } from "./emcReportPdf"

async function generatePDF(
  report: any,
  data: any,
  user: any
) {
  const html = await generateHTML(
    report,
    data,
    user
  )

  const pdf = await htmlToPdf(html)

  return pdf
}

async function generateExcel(report: any, data: any, user: any) {
  return { file: "EXCEL_DATA", data }
}

const outputHandlers: Record<string, Function> = {
  HTML: generateHTML,
  PDF: generatePDF,
  EXCEL: generateExcel
}

// ================= MAIN =================
export async function executeReport(
  report: any,
  params: any,
  user: any,
  selectedOutput?: string
) {
  report.parameters?.forEach((p: any) => {
    if (p.required && !params[p.name]) {
      throw new Error(`Missing parameter: ${p.name}`)
    }
  })

  let data

  if (report.dataSource.type === "mongo") {
    data = await executeMongoSource(report, params, user)
  } else if (report.dataSource.type === "handler") {
    data = await executeHandler(report, params, user)
  } else {
    throw new Error("Invalid dataSource")
  }

  const output =
    selectedOutput ||
    report.defaultOutput ||
    "HTML"

  const handler = outputHandlers[output]

  if (!handler) {
    throw new Error("Invalid output type")
  }

  return await handler(report, data, user)
}

// ================= ENTRY =================
export async function runReport(report: any, params: any, user: any) {
  if (report.execution?.mode === "BACKGROUND") {
    const db = mongoose.connection.db

    const res = await db.collection("emcReportJobs").insertOne({
      reportId: report.reportId,
      params,
      status: "QUEUED",
      createdBy: user.id,
      createdWhen: new Date()
    })

    return res.insertedId
  }

  return await executeReport(report, params, user)
}
