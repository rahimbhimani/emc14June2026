import mongoose from "mongoose"

/* ======================================================
   GENERIC VALUE RESOLVER
====================================================== */
function getValue(obj: any, path: string) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj)
}

export default async function executeActionEngine(payload: any) {

  const db = mongoose.connection.db

  const {
    organizationId,
    actionId,
    destination,
    containers = {},
    userContext,
    input = {}
  } = payload

  const destType = destination.type
  const destIDX = destination.idx

  const session = await mongoose.startSession()
  session.startTransaction()

  try {

    /* =====================================
       LOAD CONFIG
    ===================================== */

    const destConfig = await db
      .collection("emcOrganizationContainerConfig")
      .findOne({ organizationId, type: destType })

    if (!destConfig)
      throw new Error("Destination config not found")

    const actionDef = destConfig.actions?.find(
      (a: any) => a.id === actionId
    )

    if (!actionDef)
      throw new Error("Action not configured")

    /* =====================================
       ROLE VALIDATION
    ===================================== */

    if (
      actionDef.roles &&
      !actionDef.roles.includes(userContext?.role)
    ) {
      throw new Error("Unauthorized action")
    }

    const orchestration = actionDef.orchestration || {}

    const destCollection = destConfig.storage.collection

    /* =====================================
       LOAD DESTINATION
    ===================================== */

    const destinationContainer = await db
      .collection(destCollection)
      .findOne({
        [destConfig.storage.organizationKey]: organizationId,
        [destConfig.storage.keyPath || "IDX"]: destIDX
      })

    if (!destinationContainer)
      throw new Error("Destination container not found")

    const previousLifecycle = destinationContainer.lifecycle || {}

    /* =====================================
       PROCESS CONTAINERS
    ===================================== */

    for (const containerType in containers) {

      const containerPayload = containers[containerType]

      const childConfig = await db
        .collection("emcOrganizationContainerConfig")
        .findOne({
          organizationId,
          type: containerType
        })

      if (!childConfig) continue

      const isInventoryManaged =
        childConfig.inventoryManaged === true

      const childCollection = childConfig.storage.collection

      const keyPath = childConfig.storage.primaryKey || "IDX"
      const orgKey = childConfig.storage.organizationKey || "organizationId"

      /* ==================================================
         INVENTORY (UNCHANGED)
      ================================================== */

      if (isInventoryManaged) {

        const quantities = containerPayload.quantities || {}

        for (const productIDX in quantities) {

          const qty = Number(quantities[productIDX])
          if (!qty || qty <= 0) continue

          await db.collection("emcContainerInventory")
            .updateOne(
              {
                organizationId,
                containerType: destType,
                containerIDX: destIDX,
                productIDX
              },
              {
                $inc: { quantity: qty },
                $set: {
                  updatedAt: new Date(),
                  updatedBy: userContext?.userId
                }
              },
              { upsert: true, session }
            )
        }
      }

      /* ==================================================
         STRUCTURAL + NON-STRUCTURAL (GENERIC)
      ================================================== */

      else {

        const selected =
          containerPayload.children ||
          containerPayload.items ||
          []

        /* ------------------------------------------
           CURRENTLY ASSIGNED
        ------------------------------------------ */

        const currentlyAssigned = await db
          .collection(childCollection)
          .find({
            [orgKey]: organizationId,
            parentIDX: destIDX,
            parentType: destType
          })
          .toArray()

        const currentIDXs = currentlyAssigned.map(c =>
          getValue(c, keyPath)
        )

        /* ------------------------------------------
           REMOVED (UNCHECKED)
        ------------------------------------------ */

        const removed = currentIDXs.filter(
          idx => !selected.includes(idx)
        )

        /* ------------------------------------------
           HANDLE REMOVAL
        ------------------------------------------ */

        for (const child of currentlyAssigned) {

          const childIDXValue = getValue(child, keyPath)

          if (!removed.includes(childIDXValue)) continue

          const restoreParentIDX = child.previousParentIDX || null
          const restoreParentType = child.previousParentType || null

          await db.collection(childCollection)
            .updateOne(
              {
                [orgKey]: organizationId,
                [keyPath]: childIDXValue
              },
              {
                $set: {
                  parentIDX: restoreParentIDX,
                  parentType: restoreParentType,
                  updatedAt: new Date(),
                  updatedBy: userContext?.userId
                },
                $unset: {
                  previousParentIDX: "",
                  previousParentType: ""
                },
                $push: {
                  movementHistory: {
                    action: "UNASSIGNED",
                    from: {
                      type: destType,
                      idx: destIDX
                    },
                    to: {
                      type: restoreParentType,
                      idx: restoreParentIDX
                    },
                    timestamp: new Date(),
                    userId: userContext?.userId
                  }
                }
              },
              { session }
            )
        }

        /* ------------------------------------------
           HANDLE NEW ASSIGNMENTS
        ------------------------------------------ */

        for (const childIDX of selected) {

          if (currentIDXs.includes(childIDX)) continue

          const existing = await db
            .collection(childCollection)
            .findOne({
              [orgKey]: organizationId,
              [keyPath]: childIDX
            })

          await db.collection(childCollection)
            .updateOne(
              {
                [orgKey]: organizationId,
                [keyPath]: childIDX
              },
              {
                $set: {
                  previousParentIDX: existing?.parentIDX || null,
                  previousParentType: existing?.parentType || null,
                  parentIDX: destIDX,
                  parentType: destType,
                  updatedAt: new Date(),
                  updatedBy: userContext?.userId
                },
                $push: {
                  movementHistory: {
                    action: "ASSIGNED",
                    from: {
                      type: existing?.parentType || null,
                      idx: existing?.parentIDX || null
                    },
                    to: {
                      type: destType,
                      idx: destIDX
                    },
                    timestamp: new Date(),
                    userId: userContext?.userId
                  }
                }
              },
              { session }
            )
        }

      }

    }

    /* ==================================================
       LIFECYCLE UPDATE (UNCHANGED)
    ================================================== */

    let lifecycleUpdates: any = {}
    let historyEntry: any = {
      updatedBy: userContext?.userId,
      updatedAt: new Date(),
      remarks: input?.remarks || ""
    }

    if (destConfig.actions?.length) {

      const actionDef = destConfig.actions.find(
        (a: any) => a.id === actionId
      )

      if (actionDef?.tracks) {

        for (const t of actionDef.tracks) {

          const oldValue = previousLifecycle?.[t.track]

          lifecycleUpdates[t.track] = t.to

          historyEntry[t.track] = {
            from: oldValue,
            to: t.to
          }
        }
      }
    }

    if (Object.keys(lifecycleUpdates).length) {

      historyEntry.actionId = actionId

      await db.collection(destCollection)
        .updateOne(
          {
            [destConfig.storage.organizationKey]: organizationId,
            [destConfig.storage.keyPath || "IDX"]: destIDX
          },
          {
            $set: Object.fromEntries(
              Object.entries(lifecycleUpdates).map(
                ([k, v]) => [`lifecycle.${k}`, v]
              )
            ),
            $push: {
              "lifecycle.history": historyEntry
            }
          },
          { session }
        )
    }

    /* ==================================================
       AUDIT LOG (UNCHANGED)
    ================================================== */

    await db.collection("emcAuditLogs")
      .insertOne(
        {
          organizationId,
          entityType: destType,
          entityIDX: destIDX,
          actionId,
          performedBy: {
            userId: userContext?.userId,
            role: userContext?.role
          },
          timestamp: new Date()
        },
        { session }
      )

    /* ==================================================
       COMMIT
    ================================================== */

    await session.commitTransaction()

    return { success: true }

  }
  catch (err) {

    await session.abortTransaction()
    throw err

  }
  finally {

    session.endSession()

  }

}
