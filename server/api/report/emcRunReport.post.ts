import { runReport } from "@/server/services/report/emcReportEngine"
import mongoose from "mongoose"

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const {
    reportId,
    params,
    output
  } = body

  const db = mongoose.connection.db

  const report = await db
    .collection("emcReportConfigs")
    .findOne({
      reportId
    })

  if (!report) {
    throw createError({
      statusCode: 404,
      statusMessage: "Report not found"
    })
  }

  // Replace with your real auth user
  const user = {
    id: "SYSTEM",
    organizationId: 12313
  }

  const result = await runReport(
    report,
    params || {},
    user
  )

  const finalOutput =
    output ||
    report.defaultOutput ||
    "HTML"

  // ================= HTML =================
  if (finalOutput === "HTML") {
    setHeader(
      event,
      "Content-Type",
      "text/html; charset=utf-8"
    )

    return result
  }

  // ================= PDF =================
  if (finalOutput === "PDF") {
    setHeader(
      event,
      "Content-Type",
      "application/pdf"
    )

    setHeader(
      event,
      "Content-Disposition",
      `inline; filename="${reportId}.pdf"`
    )

    return result
  }

  // ================= EXCEL =================
  if (finalOutput === "EXCEL") {
    setHeader(
      event,
      "Content-Type",
      "application/octet-stream"
    )

    return result
  }

  return result
})
