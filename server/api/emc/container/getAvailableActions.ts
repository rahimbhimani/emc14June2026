import { getAvailableActions } from "@/server/utils/getAvailableActions"

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body) {
      throw createError({
        statusCode: 400,
        statusMessage: "Request body missing"
      })
    }

    // console.log("getAvailableActions request body:", body)

    const {
      organizationId,
      containerType,
      containerIDX,
      role
    } = body
    // console.log("getAvailableActions params:", { organizationId, containerType, containerIDX, role })
    if (!organizationId || !containerType || !containerIDX) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required parameters"
      })
    }

    const actions = await getAvailableActions({
      organizationId,
      containerType,
      containerIDX,
      role
    })

    return {
      success: true,
      actions
    }

  } catch (error: any) {
    console.error("getAvailableActions error:", error)

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Internal Server Error"
    })
  }
})
