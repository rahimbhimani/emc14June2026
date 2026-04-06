import mongoose from "mongoose"

export default defineEventHandler(async (event) => {
  const { jobId } = getQuery(event)

  const db = mongoose.connection.db

  return await db.collection("emcReportJobs").findOne({
    _id: new mongoose.Types.ObjectId(jobId as string)
  })
})
