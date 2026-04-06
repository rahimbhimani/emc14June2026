import mongoose from "mongoose"

// ================= TOKEN FORMAT =================
function formatId(counter: any) {
  const now = new Date()

  const tokens: Record<string, string> = {
    "{prefix}": counter.prefix || counter.entity,
    "{org}": counter.orgId,
    "{entity}": counter.entity,

    "{YYYY}": String(now.getFullYear()),
    "{YY}": String(now.getFullYear()).slice(-2),
    "{MM}": String(now.getMonth() + 1).padStart(2, "0"),
    "{DD}": String(now.getDate()).padStart(2, "0"),

    "{seq}": String(counter.sequence).padStart(counter.padding || 4, "0")
  }

  let format = "{prefix}-{seq}" || counter.format

  for (const key in tokens) {
    format = format.replaceAll(key, tokens[key])
  }

  return format
}

// ================= RESET =================
function shouldReset(counter: any) {
  if (!counter.reset) return false

  const last = new Date(counter.lastReset || 0)
  const now = new Date()

  if (counter.reset === "YEARLY") {
    return now.getFullYear() !== last.getFullYear()
  }

  if (counter.reset === "MONTHLY") {
    return (
      now.getFullYear() !== last.getFullYear() ||
      now.getMonth() !== last.getMonth()
    )
  }

  if (counter.reset === "DAILY") {
    return now.toDateString() !== last.toDateString()
  }

  return false
}

// ================= MAIN =================
export async function generateId(orgId: string, entity: string) {
  if (!orgId || !entity) {
    throw new Error("orgId and entity are required")
  }

  const db = mongoose.connection.db

  const counterId = `${orgId}_${entity}`

  // ================= FETCH =================
  let counter = await db.collection("emcCounters").findOne({
    _id: counterId
  })

  // ================= INIT =================
  if (!counter) {
    counter = {
      _id: counterId,
      orgId,
      entity,

      prefix: entity,
      sequence: 0,
      padding: 4,
      format: "{org}-{seq}",

      lastUpdated: new Date()
    }

    await db.collection("emcCounters").insertOne(counter)
  }

  // ================= RESET =================
  if (shouldReset(counter)) {
    await db.collection("emcCounters").updateOne(
      { _id: counterId },
      {
        $set: {
          sequence: 0,
          lastReset: new Date()
        }
      }
    )
  }

  // ================= ATOMIC INCREMENT =================
  const result = await db.collection("emcCounters").findOneAndUpdate(
    { _id: counterId },
    {
      $inc: { sequence: 1 },
      $set: { lastUpdated: new Date() }
    },
    { returnDocument: "after" }
  )

  const updated = result?.value ?? result

  if (!updated) {
    throw new Error("Failed to generate ID: counter not updated")
  }

  // ================= FORMAT =================
  const id = formatId(updated)

  return {
    id,
    sequence: updated.sequence,
    orgId,
    entity
  }
}
