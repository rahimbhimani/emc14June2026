import connectDB from "../../../utils/db"

export async function getReportConfig(reportId: string) {
  const db = await connectDB()
  return await db.collection("emcReports").findOne({ _id: reportId })
}
