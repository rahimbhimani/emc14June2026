export async function reduceInventory(params: any) {

  const {
    db,
    session,
    organizationId,
    containerIDX,
    productIDX,
    quantity
  } = params

  const inv = await db.collection("emcContainerInventory")
    .findOne({
      organizationId,
      containerIDX,
      productIDX
    })

  if (!inv || inv.quantity < quantity)
    throw new Error(`Insufficient stock in ${containerIDX}`)

  await db.collection("emcContainerInventory")
    .updateOne(
      {
        organizationId,
        containerIDX,
        productIDX
      },
      {
        $inc: { quantity: -quantity }
      },
      { session }
    )

}
