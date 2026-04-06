import mongoose from "mongoose"

export default defineEventHandler(async (event) => {

  const { organizationId, containerType, containerIDX } =
    await readBody(event)

  const db = mongoose.connection.db

  const refs = await db.collection("emcActionReferenceData")
    .find({
      organizationId,
      containerType,
      containerIDX
    })
    .sort({ createdAt: -1 })
    .toArray()

  return { success: true, refs }

})
