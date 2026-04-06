export async function writeLedger(params: any) {

  const {
    db,
    session,
    organizationId,
    movementType,
    source,
    destination,
    productIDX,
    entityIDX,
    quantity,
    userContext
  } = params

  await db.collection("emcMovementLedger")
    .insertOne({

      organizationId,

      movementType,

      sourceContainer: source,
      destinationContainer: destination,

      productIDX,
      entityIDX,

      quantity: quantity || null,

      user: userContext?.userId,

      createdAt: new Date()

    }, { session })

}
