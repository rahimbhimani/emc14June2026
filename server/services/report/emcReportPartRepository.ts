import mongoose from "mongoose"

export async function getReportPart(
  partId: string,
  organizationId?: any
) {
  if (!partId) return null

  const db = mongoose.connection.db

  // 1. Organization override
  if (organizationId != null) {
    const orgPart = await db.collection("emcReportParts").findOne({
      partId,
      organizationId
    })

    if (orgPart) return orgPart
  }

  // 2. Generic fallback
  return await db.collection("emcReportParts").findOne({
    _id: partId
  })
}
