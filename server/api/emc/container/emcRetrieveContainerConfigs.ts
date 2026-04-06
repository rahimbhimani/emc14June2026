import { readBody } from "h3"
import mongoose from "mongoose"

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.organizationId) {
    throw createError({
      statusCode: 400,
      statusMessage: "organizationId required"
    })
  }

  const db = mongoose.connection

  const configs = await db
    .collection("emcOrganizationContainerConfig")
    .find({ organizationId: body.organizationId })
    .toArray()

  return {
    success: true,
    configs
  }
})
