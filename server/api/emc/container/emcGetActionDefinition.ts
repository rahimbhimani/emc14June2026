import mongoose from "mongoose"

export default defineEventHandler(async (event) => {

  const body = await readBody(event)

  const {
    organizationId,
    containerType,
    actionId
  } = body || {}

  if (!organizationId || !containerType || !actionId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing required parameters"
    })
  }

  const db = mongoose.connection.db

  const config = await db
    .collection("emcOrganizationContainerConfig")
    .findOne({ organizationId, type: containerType })

  if (!config) {
    throw createError({
      statusCode: 404,
      statusMessage: "Config not found"
    })
  }

  const action = config.actions?.find(
    (a: any) => a.id === actionId
  )

  if (!action) {
    throw createError({
      statusCode: 404,
      statusMessage: "Action not found"
    })
  }

  return {
    success: true,
    action
  }
})
