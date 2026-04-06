import executeActionEngine from "~/server/utils/emcOrchestration/emcExecuteActionEngine"

export default defineEventHandler(async (event) => {

  const body = await readBody(event)

  return executeActionEngine(body)

})
