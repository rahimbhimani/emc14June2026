import { emcExecuteMovement } from "@/server/utils/emcOrchestrationEngine"

export default defineEventHandler(async (event) => {

  const body = await readBody(event)

  return await emcExecuteMovement(body)
})
