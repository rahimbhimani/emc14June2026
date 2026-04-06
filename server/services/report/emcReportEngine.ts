import mongoose from "mongoose"
import { emcReportHandlers } from "./emcReportHandlers"
import {
  ALLOWED_COLLECTIONS,
  validatePipeline
} from "./emcReportSecurity"

// ================= PARAM INJECTION =================

function injectParams(obj: any, params: any): any {
  if (typeof obj === "string") {
    const match = obj.match(/^\{\{(.+?)\}\}$/)
    if (match) return params[match[1]]
    return obj
  }

  if (Array.isArray(obj)) return obj.map(i => injectParams(i, params))

  if (typeof obj === "object" && obj !== null) {
    const result: any = {}
    for (const key in obj) {
      result[key] = injectParams(obj[key], params)
    }
    return result
  }

  return obj
}

// ================= MONGO EXECUTION =================

async function executeMongoSource(report: any, params: any, user: any) {
  const { collection, pipeline } = report.dataSource

  if (!ALLOWED_COLLECTIONS.includes(collection)) {
    throw new Error("Collection not allowed")
  }

  let finalPipeline = injectParams(pipeline, params)

  // enforce org security
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

// ================= HANDLER EXECUTION =================

async function executeHandler(report: any, params: any, user: any) {
  const handler = emcReportHandlers[report.dataSource.handler]
  if (!handler) throw new Error("Handler not found")

  return await handler(params, user)
}

// ================= OUTPUT HANDLERS =================

async function generateHTML(data: any) {
  return `<pre>${JSON.stringify(data, null, 2)}</pre>`
}

async function generatePDF(data: any) {
  return { file: "PDF_DATA", data }
}

async function generateExcel(data: any) {
  return { file: "EXCEL_DATA", data }
}

const outputHandlers: Record<string, Function> = {
  HTML: generateHTML,
  PDF: generatePDF,
  EXCEL: generateExcel
}

// ================= MAIN EXECUTION =================

export async function executeReport(
  report: any,
  params: any,
  user: any,
  selectedOutput?: string
) {
  // validate params
  report.parameters?.forEach((p: any) => {
    if (p.required && !params[p.name]) {
      throw new Error(`Missing parameter: ${p.name}`)
    }
  })

  let data

  if (report.dataSource.type !== "mongo") {
    throw new Error("Only mongo dataSource supported")
  }

  data = await executeMongoSource(report, params, user)

  const output = selectedOutput || report.defaultOutput || "HTML"

  const handler = outputHandlers[output]
  if (!handler) throw new Error("Invalid output type")

  return await handler(data)
}

// ================= JOB =================

export async function enqueueReportJob(report: any, params: any, user: any) {
  const db = mongoose.connection.db

  const job = {
    reportId: report.reportId,
    params,
    status: "QUEUED",
    createdBy: user.id,
    createdWhen: new Date()
  }

  const res = await db.collection("emcReportJobs").insertOne(job)
  return res.insertedId
}

// ================= ENTRY =================

export async function runReport(report: any, params: any, user: any) {
  if (report.execution?.mode === "BACKGROUND") {
    return await enqueueReportJob(report, params, user)
  }

  return await executeReport(report, params, user)
}
