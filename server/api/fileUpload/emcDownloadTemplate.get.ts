import mongoose from "mongoose"

export default defineEventHandler(async (event) => {
  const { uploadId } = getQuery(event)

  const db = mongoose.connection.db

  const config = await db
    .collection("emcFileUploadConfigs")
    .findOne({ uploadId })

  return config.mapping.map((m: any) => m.column)
})
