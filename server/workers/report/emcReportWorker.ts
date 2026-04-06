import { executeReport } from "@/server/services/report/emcReportEngine"
import mongoose from "mongoose"

export async function processEmcReportJobs() {
  const db = mongoose.connection.db

  const jobs = await db.collection("emcReportJobs")
    .find({ status: "QUEUED" })
    .limit(5)
    .toArray()

  for (const job of jobs) {
    try {
      await db.collection("emcReportJobs").updateOne(
        { _id: job._id },
        { $set: { status: "RUNNING", startedWhen: new Date() } }
      )

      const report = await db.collection("emcReportConfigs")
        .findOne({ reportId: job.reportId })

      const result = await executeReport(
        report,
        job.params,
        { organizationId: "ORG1" }
      )

      await db.collection("emcReportJobs").updateOne(
        { _id: job._id },
        {
          $set: {
            status: "COMPLETED",
            result,
            completedWhen: new Date()
          }
        }
      )

    } catch (e: any) {
      await db.collection("emcReportJobs").updateOne(
        { _id: job._id },
        { $set: { status: "FAILED", error: e.message } }
      )
    }
  }
}
