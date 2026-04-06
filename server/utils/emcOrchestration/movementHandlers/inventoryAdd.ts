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

  await db.collection("emcContainerInventory")
    .updateOne(
      {
        organizationId,
        containerType,
        containerIDX,
        productIDX
      },
      {
        $inc: { quantity },
        $set: { updatedAt: new Date() }
      },
      {
        upsert: true,
        session
      }
    )

}
