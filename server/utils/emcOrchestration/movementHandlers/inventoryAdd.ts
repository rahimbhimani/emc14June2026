export async function inventoryAdd(params: any) {
  const {
    db,
    session,
    organizationId,
    containerType,
    containerIDX,
    productIDX,
    quantity
  } = params

  await db.collection("emcContainerInventory").updateOne(
    {
      organizationId,
      containerIDX,
      productIDX
    },
    {
      $inc: { quantity: Number(quantity || 0) },
      $set: {
        containerType,
        updatedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    },
    {
      upsert: true,
      session
    }
  )
}
