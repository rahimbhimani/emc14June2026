import mongoose from "mongoose"

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const {
    organizationId,
    containerIDX
  } = body

  const db = mongoose.connection.db

  const row = await db
    .collection("emcActionReferenceData")
    .findOne(
      {
        organizationId,
        containerIDX
      },
      {
        sort: { createdAt: -1 }
      }
    )

  return {
    success: true,
    data: row || null,
    message:
      row?.data?.input?.remarks ||
      row?.data?.input?.reason ||
      "No remarks found"
  }
})
