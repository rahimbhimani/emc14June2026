import { writeLedger } from "../emcMovementLedger"

export async function structuralAssign(params: any) {

  const {
    db,
    session,
    organizationId,
    destinationType,
    destinationIDX,
    children,
    userContext
  } = params

  for (const childIDX of children) {

    await db.collection("emcTrolley")
      .updateOne(
        {
          organizationId,
          IDX: childIDX
        },
        {
          $set: {
            parentIDX: destinationIDX
          }
        },
        { session }
      )

    await writeLedger({
      db,
      session,
      organizationId,
      movementType: "STRUCTURAL",
      source: null,
      destination: destinationIDX,
      entityIDX: childIDX,
      userContext
    })

  }

}
