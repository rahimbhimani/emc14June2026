export async function reduceInventory(params: any) {
  const {
    db,
    session,
    organizationId,
    containerIDX,
    productIDX,
    quantity
  } = params

  const rows = await db.collection("emcContainerInventory")
    .find(
      {
        organizationId,
        containerIDX,
        productIDX
      },
      { session }
    )
    .toArray()

  const total = rows.reduce(
    (sum: number, r: any) => sum + Number(r.quantity || 0),
    0
  )

  if (total < quantity) {
    throw new Error(`Insufficient stock in ${containerIDX}`)
  }

  let remaining = quantity

  for (const row of rows) {
    if (remaining <= 0) break

    const available = Number(row.quantity || 0)
    const deduct = Math.min(available, remaining)

    await db.collection("emcContainerInventory").updateOne(
      { _id: row._id },
      { $inc: { quantity: -deduct } },
      { session }
    )

    remaining -= deduct
  }

  await db.collection("emcContainerInventory").deleteMany(
    {
      organizationId,
      containerIDX,
      productIDX,
      quantity: { $lte: 0 }
    },
    { session }
  )
}
