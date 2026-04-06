import mongoose from "mongoose"

export default defineEventHandler(async (event) => {

  const body = await readBody(event)

  const {
    organizationId,
    containerType,
    containerIDX,
    actionId
  } = body || {}

  if (!organizationId || !containerType || !containerIDX || !actionId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing required parameters"
    })
  }

  const db = mongoose.connection.db

  /* ======================================================
     LOAD MASTER CONFIG
  ====================================================== */

  const masterConfig = await db
    .collection("emcOrganizationContainerConfig")
    .findOne({ organizationId, type: containerType })

  if (!masterConfig) {
    throw createError({
      statusCode: 404,
      statusMessage: "Container config not found"
    })
  }

  const collectionName = masterConfig.storage.collection
  const primaryKey = masterConfig.storage.primaryKey

  const master = await db.collection(collectionName).findOne({
    organizationId,
    [primaryKey]: containerIDX
  })

  if (!master) {
    throw createError({
      statusCode: 404,
      statusMessage: "Container not found"
    })
  }

  /* ======================================================
     LOAD ACTION DEFINITION
  ====================================================== */

  const actionDef = masterConfig.actions?.find(
    (a: any) => a.id === actionId
  )

  if (!actionDef) {
    throw createError({
      statusCode: 400,
      statusMessage: "Action not configured"
    })
  }

  const orchestration = actionDef.orchestration || {}

  const allowInventory = orchestration.inventory === true
  const allowStructural = orchestration.structural === true

  const groupedChildren: Record<string, any> = {}

  /* ======================================================
     LOAD INVENTORY RECORDS (ONLY IF NEEDED)
  ====================================================== */

  let inventoryMap = new Map<string, number>()

  if (allowInventory) {

    const inventoryRecords = await db
      .collection("emcContainerInventory")
      .find({
        organizationId,
        containerType,
        containerIDX
      })
      .toArray()

    for (const inv of inventoryRecords) {
      inventoryMap.set(inv.productIDX, inv.quantity)
    }
  }

  /* ======================================================
     LOOP CAN CONTAIN RULES
  ====================================================== */

  for (const rule of masterConfig.canContainRules || []) {

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
      .find({ organizationId })
      .toArray()

    /* ======================================================
       STRUCTURAL OWNERSHIP FILTER
    ====================================================== */

    let filteredChildren = children

    if (!isInventoryManaged) {

      filteredChildren = children.filter((child: any) => {

        const parent = child.parentContainerIDX || null

        // 1️⃣ Unassigned → show
        if (!parent) return true

        // 2️⃣ Already inside THIS container → show
        if (parent === containerIDX) return true

        // 3️⃣ Assigned to some other container → hide
        return false
      })
    }

    /* ======================================================
       APPLY LIFECYCLE VISIBILITY RULES
    ====================================================== */

    const visibilityRule =
      actionDef.childVisibility?.find(
        (v: any) => v.childType === childType
      ) || rule

    filteredChildren = filteredChildren.filter((child: any) =>
      passesLifecycleRule(child, visibilityRule)
    )

    /* ======================================================
       ENRICH INVENTORY
    ====================================================== */

    const enrichedChildren = filteredChildren.map((child: any) => {

      if (isInventoryManaged) {
        return {
          ...child,
          currentQuantity: inventoryMap.get(child.IDX) || 0
        }
      }

      return child
    })

    groupedChildren[childType] = {
      config: childConfig,
      items: enrichedChildren
    }
  }

  return {
    success: true,
    master,
    groupedChildren
  }
})

/* ======================================================
   LIFECYCLE RULE CHECK
====================================================== */

function passesLifecycleRule(entity: any, rule: any) {

  if (!rule) return true

  const lifecycle = entity.lifecycle || {}

  const allowedLifecycle = rule.allowedLifecycle || null
  const disallowedLifecycle = rule.disallowedLifecycle || null

  if (!allowedLifecycle && !disallowedLifecycle) {
    return true
  }

  if (allowedLifecycle) {
    for (const track of Object.keys(allowedLifecycle)) {
      const allowedStates = allowedLifecycle[track]
      const currentState = lifecycle[track]
      if (currentState === undefined) continue
      if (!allowedStates.includes(currentState)) return false
    }
  }

  if (disallowedLifecycle) {
    for (const track of Object.keys(disallowedLifecycle)) {
      const blockedStates = disallowedLifecycle[track]
      const currentState = lifecycle[track]
      if (currentState === undefined) continue
      if (blockedStates.includes(currentState)) return false
    }
  }

  return true
}
