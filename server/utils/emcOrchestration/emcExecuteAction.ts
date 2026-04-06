import mongoose from "mongoose"

export async function emcExecuteAction(params: any) {

  const {
    organizationId,
    destinationType,
    destinationIDX,
    actionId,
    payload,
    userContext
  } = params

  const db = mongoose.connection.db
  const session = await mongoose.startSession()

  try {

    await session.withTransaction(async () => {

      /* ======================================================
      LOAD DESTINATION CONFIG
      ====================================================== */

      const destinationConfig = await db
        .collection("emcOrganizationContainerConfig")
        .findOne({ organizationId, type: destinationType })

      if (!destinationConfig)
        throw new Error("Destination container config not found")

      const actionDef = destinationConfig.actions?.find(
        (a: any) => a.id === actionId
      )

      if (!actionDef)
        throw new Error("Action not configured")



      /* ======================================================
      PAYLOAD CONTAINERS
      ====================================================== */

      const containers = payload?.containers || {}



      /* ======================================================
      LOOP CONTAINER TYPES
      ====================================================== */

      for (const containerType in containers) {

        const containerData = containers[containerType]

        const childConfig = await db
          .collection("emcOrganizationContainerConfig")
          .findOne({ organizationId, type: containerType })

        if (!childConfig) continue
        const isInventoryManaged =
          childConfig.inventoryManaged === true



        /* ======================================================
        INVENTORY MANAGED CONTAINERS (PRODUCTS)
        ====================================================== */

        if (isInventoryManaged) {

          const quantities = containerData?.quantities || {}
          const sources = containerData?.sources || {}



          /* ===============================
          ADD INVENTORY (INSTOCK)
          =============================== */

          for (const productIDX in quantities) {

            const qty = Number(quantities[productIDX] || 0)
            if (qty <= 0) continue

            await addInventory({
              db,
              session,
              organizationId,
              containerType: destinationType,
              containerIDX: destinationIDX,
              productIDX,
              quantity: qty
            })

            await createLedger({
              db,
              session,
              organizationId,
              movementType: "IN",
              sourceIDX: null,
              destinationType,
              destinationIDX,
              productIDX,
              quantity: qty,
              userContext
            })

          }



          /* ===============================
          TRANSFER INVENTORY
          =============================== */
          console.log("sources:", sources)
          for (const productIDX in sources) {
            console.log("productIDX:", productIDX)
            const sourceMap = sources[productIDX]

            for (const sourceIDX in sourceMap) {

              const qty = Number(sourceMap[sourceIDX] || 0)
              if (qty <= 0) continue

              await reduceInventory({
                db,
                session,
                organizationId,
                containerIDX: sourceIDX,
                productIDX,
                quantity: qty
              })

              await addInventory({
                db,
                session,
                organizationId,
                containerType: destinationType,
                containerIDX: destinationIDX,
                productIDX,
                quantity: qty
              })

              await createLedger({
                db,
                session,
                organizationId,
                movementType: "TRANSFER",
                sourceIDX,
                destinationType,
                destinationIDX,
                productIDX,
                quantity: qty,
                userContext
              })

            }

          }

        }



        /* ======================================================
        STRUCTURAL CONTAINERS (TROLLEYS ETC)
        ====================================================== */

        else {

          const children = containerData?.children || []

          const childCollection = childConfig.storage.collection
          const primaryKey = childConfig.storage.primaryKey

          for (const childIDX of children) {

            await db.collection(childCollection)
              .updateOne(
                {
                  organizationId,
                  [primaryKey]: childIDX
                },
                {
                  $set: {
                    parentIDX: destinationIDX,
                    updatedAt: new Date(),
                    updatedBy: userContext?.userId
                  }
                },
                { session }
              )

            await createLedger({
              db,
              session,
              organizationId,
              movementType: "STRUCTURAL",
              sourceIDX: null,
              destinationType,
              destinationIDX,
              childIDX,
              userContext
            })

          }

        }

      }

    })

  }
  finally {

    session.endSession()

  }

}



/* ======================================================
ADD INVENTORY
====================================================== */

async function addInventory(params: any) {

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



/* ======================================================
REDUCE INVENTORY
====================================================== */

async function reduceInventory(params: any) {

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



/* ======================================================
CREATE LEDGER ENTRY
====================================================== */

async function createLedger(params: any) {

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
