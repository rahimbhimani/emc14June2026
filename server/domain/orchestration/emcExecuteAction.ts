import mongoose from "mongoose"
import { createLedger } from "~/server/utils/emcOrchestration/movementHandlers/createLedger"
import { inventoryAdd } from "~/server/utils/emcOrchestration/movementHandlers/inventoryAdd"
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
        .findOne({
          organizationId,
          type: destinationType
        })

      if (!destinationConfig) {
        throw new Error("Destination config not found")
      }

      const actionDef = destinationConfig.actions?.find(
        (a: any) => a.id === actionId
      )

      if (!actionDef) {
        throw new Error("Action not configured")
      }

      const orchestration = actionDef.orchestration || {}
      const movementType = orchestration.movementType || "IN"

      /* =====================================================
         PAYLOAD
      ===================================================== */

      const products = payload?.products || {}
      const sources = payload?.sources || {}
      const containers = payload?.containers || {}

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
         STRUCTURAL SYNC VERSION
         - Assign selected rows
         - Remove deselected rows
         - No hardcoded types
      ===================================================== */

      for (const childType in containers) {
        const block = containers[childType]
        const selectedIDs: string[] = block?.children || []

        const childConfig = await db
          .collection("emcOrganizationContainerConfig")
          .findOne({
            organizationId,
            type: childType
          })

        if (!childConfig) continue

        const childCollection = childConfig.storage.collection
        const primaryKey = childConfig.storage.primaryKey
        const orgKey = childConfig.storage.organizationKey

        /* ==========================================
           CURRENTLY ASSIGNED TO DESTINATION
        ========================================== */

        const existingRows = await db
          .collection(childCollection)
          .find({
            [orgKey]: organizationId,
            parentIDX: destinationIDX
          })
          .project({ [primaryKey]: 1 })
          .toArray()

        const existingIDs = existingRows.map(
          (r: any) => String(r[primaryKey])
        )

        const selectedSet = new Set(
          selectedIDs.map(v => String(v))
        )

        const existingSet = new Set(existingIDs)

        /* ==========================================
           TO ADD = selected but not existing
        ========================================== */

        const toAdd = selectedIDs.filter(
          id => !existingSet.has(String(id))
        )

        /* ==========================================
           TO REMOVE = existing but not selected
        ========================================== */

        const toRemove = existingIDs.filter(
          id => !selectedSet.has(String(id))
        )

        /* ==========================================
           ADD
        ========================================== */

        for (const childIDX of toAdd) {
          await db.collection(childCollection).updateOne(
            {
              [orgKey]: organizationId,
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
            movementType: "STRUCTURAL_ADD",
            sourceIDX: null,
            destinationType,
            destinationIDX,
            productIDX: null,
            quantity: null,
            childIDX,
            childType,
            userContext
          })
        }

        /* ==========================================
           REMOVE
        ========================================== */

        for (const childIDX of toRemove) {
          await db.collection(childCollection).updateOne(
            {
              [orgKey]: organizationId,
              [primaryKey]: childIDX
            },
            {
              $set: {
                parentIDX: null,
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
            movementType: "STRUCTURAL_REMOVE",
            sourceIDX: destinationIDX,
            destinationType: null,
            destinationIDX: null,
            productIDX: null,
            quantity: null,
            childIDX,
            childType,
            userContext
          })
        }
      }
    })
  } finally {
    await session.endSession()
  }
}
