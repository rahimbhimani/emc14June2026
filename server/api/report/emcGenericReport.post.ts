import {
  emcRunGenericReport
} from "~/server/services/report/emcGenericReportEngine"
import { emcOrganization } from "~/server/models/emcOrganization"

export default defineEventHandler(
  async event => {
    const body = await readBody(event)

    const sessionUser =
      await getUser(event)

    const user1 = {
      id:
        sessionUser?.id ||
        "USR-001",
      userId:
        sessionUser?.id ||
        "USR-001",
      role: "MANAGER",
      ...sessionUser,
      organizationId:
        sessionUser?.organizationId ||
        12313
    }

    const organization =
      user1.organizationDetails ||
      await emcOrganization
        .findOne({
          organizationId:
            user1.organizationId
        })
        .lean()

    if (organization) {
      Object.assign(user1, {
        organization,
        organizationName:
          organization.name ||
          user1.organizationName,
        organizationLogo:
          organization.logo ||
          user1.organizationLogo
      })
    }

    console.log("Received Payload:", user1)

    return await emcRunGenericReport(
      body,
      user1
    )
  }
)
