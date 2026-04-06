import { runReport } from "@/server/services/report/emcReportEngine"
import mongoose from "mongoose"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const { reportId, params, output } = body

    const db = mongoose.connection.db

    const report = await db
      .collection("emcReportConfigs")
      .findOne({ reportId })

    if (!report) {
      throw createError({
        statusCode: 404,
        statusMessage: "Report not found"
      })
    }

    const user = event.context.user || {
      organizationId: "USR-001",
      id: "MANAGER"
    }

    return await runReport(report, params, user, output)

  } catch (e: any) {
    console.error("🔥 REPORT ERROR:", e)

    throw createError({
      statusCode: 500,
      statusMessage: e.message || "Internal Server Error"
    })
  }
})
