import mongoose from "mongoose"

export default async function emcPrepareMovement(payload: any) {

  const {
    organizationId,
    destinationType,
    destinationIDX,
    actionId
  } = payload || {}

  if (!organizationId || !destinationType || !destinationIDX || !actionId) {
    throw new Error("Missing required parameters")
  }

  const db = mongoose.connection.db

  if (!db) {
    throw new Error("Database connection not ready")
  }

  /* ======================================================
     LOAD CONFIG
  ====================================================== */

  const destinationConfig = await db
    .collection("emcOrganizationContainerConfig")
    .findOne({ organizationId, type: destinationType })

  if (!destinationConfig)
    throw new Error("Config not found")

  const actionDef = destinationConfig.actions?.find(
    (a: any) => a.id === actionId
  )

  if (!actionDef)
    throw new Error("Action not configured")

  const orchestration = actionDef.orchestration || {}

  const sourceStrategy = orchestration.sourceStrategy || "NONE"
  const allowInventory = orchestration.inventory === true
  const allowStructural = orchestration.structural === true

  const groupedChildren: any = {}

  const destinationCollection = destinationConfig.storage.collection
  const primaryKey = destinationConfig.storage.primaryKey

  const destinationContainer = await db
    .collection(destinationCollection)
    .findOne({
      organizationId,
      [primaryKey]: destinationIDX
    })

  /* ======================================================
     LOAD ALL INVENTORY
  ====================================================== */

  const allInventory = await db
    .collection("emcContainerInventory")
    .find({ organizationId })
    .toArray()

  /* ======================================================
     LOOP CHILD TYPES
  ====================================================== */

  for (const rule of destinationConfig.canContainRules || []) {

    const childType = rule.childType

    const childConfig = await db
      .collection("emcOrganizationContainerConfig")
      .findOne({ organizationId, type: childType })

    if (!childConfig) continue

    const isInventoryManaged = childConfig.inventoryManaged === true

    if (isInventoryManaged && !allowInventory) continue
    if (!isInventoryManaged && !allowStructural) continue

    const childCollection = childConfig.storage.collection

    const children = await db
      .collection(childCollection)
      .find({ [childConfig.storage.organizationKey]: organizationId })
      .toArray()

    const items: any[] = []

    /* ===============================
       INVENTORY MANAGED
    =============================== */

    if (isInventoryManaged) {

      const parentIDX = destinationContainer?.parentIDX

      const parentMap = new Map()
      const currentMap = new Map()

      for (const inv of allInventory) {

        if (inv.containerIDX === destinationIDX) {
          currentMap.set(inv.productIDX, inv.quantity)
        }

        if (sourceStrategy === "PARENT" && inv.containerIDX === parentIDX) {
          parentMap.set(inv.productIDX, inv.quantity)
        }
      }

      for (const product of children) {

        const currentQuantity = currentMap.get(product.IDX) || 0
        let totalAvailable = 0
        let sources: any[] = []

        if (sourceStrategy === "NONE") {

          items.push({
            ...product,
            name: product.tbProduct?.tbMain?.Name,
            currentQuantity
          })

          continue
        }

        if (sourceStrategy === "PARENT") {

          totalAvailable = parentMap.get(product.IDX) || 0

          if (totalAvailable > 0) {
            sources = [{
              containerIDX: parentIDX,
              available: totalAvailable
            }]
          }

          items.push({
            ...product,
            name: product.tbProduct?.tbMain?.Name,
            currentQuantity,
            totalAvailable,
            sources
          })

          continue
        }

        if (sourceStrategy === "CONTAINERTYPE") {

          for (const inv of allInventory) {

            if (inv.productIDX !== product.IDX) continue
            if (inv.quantity <= 0) continue

            totalAvailable += inv.quantity

            sources.push({
              containerIDX: inv.containerIDX,
              containerType: inv.containerType,
              available: inv.quantity
            })
          }

          items.push({
            ...product,
            name: product.tbProduct?.tbMain?.Name,
            currentQuantity,
            totalAvailable,
            sources
          })

        }

      }

    }

    /* ===============================
       STRUCTURAL
    =============================== */


    if (!isInventoryManaged) {

      let filteredChildren = children

      /* =========================================
         APPLY childVisibility (SEALED etc.)
      ========================================= */

      const visibilityRule = actionDef.childVisibility?.find(
        (v: any) => v.childType === childType
      )

      if (visibilityRule?.allowedLifecycle) {
        filteredChildren = filteredChildren.filter((child: any) => {

          for (const track in visibilityRule.allowedLifecycle) {
            const allowed = visibilityRule.allowedLifecycle[track]
            const current = child.lifecycle?.[track]

            if (!allowed.includes(current)) return false
          }

          return true
        })
      }

      /* =========================================
         REMOVE assignedElsewhere ❌
      ========================================= */

      filteredChildren = filteredChildren.filter(
        (child: any) =>
          !child.parentIDX || child.parentIDX === destinationIDX
      )

      /* =========================================
         BUILD ITEMS
      ========================================= */

      for (const child of filteredChildren) {

        items.push({
          ...child,
          name: child.tbTrolley?.tbMain?.Name,
          assignedHere: child.parentIDX === destinationIDX
        })

      }

    }


    groupedChildren[childType] = {
      config: childConfig,
      items
    }

  }

  return {
    groupedChildren,
    orchestration
  }

}
