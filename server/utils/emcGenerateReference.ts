import mongoose from "mongoose"

export async function generateReferenceNumber(
  organizationId: number,
  referenceType: string
) {

  const db = mongoose.connection.db

  const counter = await db.collection("emcReferenceCounters").findOneAndUpdate(
    {
      organizationId,
      referenceType
    },
    {
      $inc: { sequence: 1 }
    },
    {
      upsert: true,
      returnDocument: "after"
    }
  )

  // console.log("Counter after increment:", counter.sequence)

  const seq = counter?.sequence || 1

  return `${referenceType}-${String(seq).padStart(6, "0")}`
}
