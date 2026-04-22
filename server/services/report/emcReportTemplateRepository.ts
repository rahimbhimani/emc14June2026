import mongoose from "mongoose"

export async function getReportTemplate(
  templateId: string
) {
  if (!templateId) return null

  const db = mongoose.connection.db

  return await db.collection("emcReportTemplates").findOne({
    _id: templateId,
    isActive: true
  })
}
