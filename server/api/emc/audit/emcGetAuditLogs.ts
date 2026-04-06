import mongoose from "mongoose"

export default defineEventHandler(async (event) => {

  const { organizationId, containerType, containerIDX } =
    await readBody(event)

  const db = mongoose.connection.db

  const logs = await db.collection("emcAuditLogs")
    .find({
      organizationId,
      entityType: containerType,
      entityIDX: containerIDX
    })
    .sort({ timestamp: -1 })
    .toArray()

  return { success: true, logs }

})
