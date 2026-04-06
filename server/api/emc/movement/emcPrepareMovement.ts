import emcPrepareMovement from "@/server/api/emc/orchestration/emcPrepareMovement"

export default defineEventHandler(async (event) => {

  const body = await readBody(event)

  const result = await emcPrepareMovement(body)

  return {
    success: true,
    ...result
  }

})
