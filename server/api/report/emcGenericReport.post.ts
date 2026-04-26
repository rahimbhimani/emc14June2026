import {
  emcRunGenericReport
} from "~/server/services/report/emcGenericReportEngine"

export default defineEventHandler(
  async event => {
    const body = await readBody(event)
    let user1 = {
      userId: "USR-001",
      role: "MANAGER",
      organizationId: 12313
    }
    console.log("Received Payload:", user1)
    return await emcRunGenericReport(
      body,
      user1
    )
  }
)
