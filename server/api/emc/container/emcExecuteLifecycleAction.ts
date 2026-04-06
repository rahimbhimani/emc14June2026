import { emcExecuteLifecycleAction } from "@/server/utils/emcLifeCycleEngine"

export default defineEventHandler(async (event) => {

  try {

    const body = await readBody(event)

    if (!body) {
      throw createError({
        statusCode: 400,
        statusMessage: "Request body missing"
      })
    }

    const {
      organizationId,
      containerType,
      containerIDX,
      actionId,
      payload,
      userContext
    } = body

    if (!organizationId ||
      !containerType ||
      !containerIDX ||
      !actionId ||
      !userContext?.userId) {

      throw createError({
        statusCode: 400,
        statusMessage: "Missing required parameters"
      })
    }

    const result = await emcExecuteLifecycleAction({
      organizationId,
      containerType,
      containerIDX,
      actionId,
      payload,
      userContext
    })

    return {
      success: true,
      correlationId: result.correlationId
    }

  } catch (error: any) {

    console.error("emcExecuteLifecycleAction error:", error)

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Internal Server Error"
    })
  }

})
