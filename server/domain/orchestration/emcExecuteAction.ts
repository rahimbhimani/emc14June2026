import mongoose from "mongoose"
import { createLedger } from "~/server/utils/emcOrchestration/movementHandlers/createLedger"
import { reduceInventory } from "~/server/utils/emcOrchestration/movementHandlers/reduceInventory"

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

      /* =====================================================
      LOAD DESTINATION CONFIG
      ===================================================== */

      const destinationConfig = await db
        .collection("emcOrganizationContainerConfig")
        .findOne({ organizationId, type: destinationType })

      if (!destinationConfig)
        throw new Error("Destination config not found")

      const actionDef = destinationConfig.actions?.find(
        (a: any) => a.id === actionId
      )

      if (!actionDef)
        throw new Error("Action not configured")

      const orchestration = actionDef.orchestration || {}

      const movementType = orchestration.movementType || "IN"



      /* =====================================================
      PAYLOAD
      ===================================================== */

      const products = payload?.products || {}
      const sources = payload?.sources || {}
      const containers = payload?.containers || []


      console.log("movementType123:", movementType)
      /* =====================================================
      INVENTORY ADD (IN)
      ===================================================== */

      if (movementType === "IN") {

        for (const productIDX in products) {

          const qty = Number(products[productIDX] || 0)
          if (qty <= 0) continue

          await inventoryAdd({
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
            sourceType: null,
            sourceIDX: null,
            destinationType,
            destinationIDX,
            productIDX,
            quantity: qty,
            userContext
          })

        }

      }



      /* =====================================================
      INVENTORY TRANSFER
      ===================================================== */

      if (movementType === "TRANSFER") {

        for (const productIDX in sources) {

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

            await inventoryAdd({
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



      /* =====================================================
      STRUCTURAL ASSIGNMENT
      ===================================================== */

      if (containers.length) {

        for (const childIDX of containers) {

          const childConfig = await db
            .collection("emcOrganizationContainerConfig")
            .findOne({
              organizationId,
              type: "Trolley"
            })

          const childCollection = childConfig.storage.collection
          const primaryKey = childConfig.storage.primaryKey

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
            productIDX: null,
            quantity: null,
            childIDX,
            userContext
          })

        }

      }

    })

  }
  finally {

    session.endSession()

  }

}
