export async function createLedger(params: any) {

  const {
    db,
    session,
    organizationId,
    movementType,
    sourceIDX,
    destinationType,
    destinationIDX,
    productIDX,
    quantity,
    childIDX,
    userContext
  } = params

  await db.collection("emcMovementLedger")
    .insertOne(
      {
        organizationId,
        movementType,
        sourceIDX,
        destinationType,
        destinationIDX,
        productIDX,
        quantity,
        childIDX,
        createdAt: new Date(),
        createdBy: userContext?.userId
      },
      { session }
    )

}
