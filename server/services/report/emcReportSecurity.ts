export const ALLOWED_STAGES = [
  "$match", "$project", "$lookup", "$unwind", "$group", "$sort", "$limit"
]

export const BLOCKED_OPERATORS = ["$where", "$function", "$accumulator"]

export const ALLOWED_COLLECTIONS = ["containers", "transactions", "flights"]

export function validatePipeline(pipeline: any[]) {
  for (const stage of pipeline) {
    const key = Object.keys(stage)[0]

    if (!ALLOWED_STAGES.includes(key)) {
      throw new Error(`Stage not allowed: ${key}`)
    }

    const json = JSON.stringify(stage)

    for (const blocked of BLOCKED_OPERATORS) {
      if (json.includes(blocked)) {
        throw new Error(`Blocked operator detected: ${blocked}`)
      }
    }
  }
}
