import { writeLedger } from "../emcMovementLedger"

export async function inventoryTransfer(params: any) {

  const {
    db,
    session,
    organizationId,
    destinationType,
    destinationIDX,
    productIDX,
    sources,
    userContext
  } = params

  for (const src of sources) {

    const { containerIDX, quantity } = src

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
        { _id: inv._id },
        { $inc: { quantity: -quantity } },
        { session }
      )

    await db.collection("emcContainerInventory")
      .updateOne(
        {
          organizationId,
          containerType: destinationType,
          containerIDX: destinationIDX,
          productIDX
        },
        { $inc: { quantity } },
        { session, upsert: true }
      )

    await writeLedger({
      db,
      session,
      organizationId,
      movementType: "TRANSFER",
      source: containerIDX,
      destination: destinationIDX,
      productIDX,
      quantity,
      userContext
    })

  }

}
