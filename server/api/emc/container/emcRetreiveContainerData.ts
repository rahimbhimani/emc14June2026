import mongoose from "mongoose"

export default defineEventHandler(async (event) => {

  const body = await readBody(event)

  const { organizationId, type } = body || {}

  if (!organizationId || !type) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing parameters"
    })
  }

  const db = mongoose.connection.db

  /* ======================================================
     LOAD CONFIG
  ====================================================== */

  const config = await db
    .collection("emcOrganizationContainerConfig")
    .findOne({
      organizationId,
      type
    })

  if (!config) {
    return { success: true, instances: [] }
  }

  const collectionName = config.storage.collection

  /* ======================================================
     LOAD INSTANCES
  ====================================================== */

  const instances = await db
    .collection(collectionName)
    .find({ [config.storage.organizationKey]: organizationId })
    .toArray()

  if (!instances.length) {
    return { success: true, instances: [] }
  }

  /* ======================================================
     LOAD CHILD CONFIG (IMPORTANT)
  ====================================================== */

  const childRule = config.canContainRules?.[0]

  let childConfig: any = null
  let childCollection = null

  if (childRule) {
    childConfig = await db
      .collection("emcOrganizationContainerConfig")
      .findOne({
        organizationId,
        type: childRule.childType
      })

    childCollection = childConfig?.storage?.collection
  }

  /* ======================================================
     BUILD CHILD MAP (Flight → Trolley)
  ====================================================== */

  const childMap = new Map()

  if (childCollection) {

    const children = await db
      .collection(childCollection)
      .find({ organizationId })
      .toArray()

    for (const child of children) {

      const parent = child.parentIDX

      if (!childMap.has(parent)) {
        childMap.set(parent, [])
      }

      childMap.get(parent).push(child.IDX)
    }
  }

  /* ======================================================
     INVENTORY AGG (TROLLEY LEVEL)
  ====================================================== */

  const inventoryAgg = await db
    .collection("emcContainerInventory")
    .aggregate([
      {
        $match: { organizationId }
      },
      {
        $group: {
          _id: {
            containerIDX: "$containerIDX",
            productIDX: "$productIDX"
          },
          qty: { $sum: "$quantity" }
        }
      }
    ])
    .toArray()

  /* ======================================================
     BUILD INVENTORY MAP (PER CONTAINER)
  ====================================================== */

  const inventoryMap = new Map()

  for (const inv of inventoryAgg) {

    const cIDX = inv._id.containerIDX

    if (!inventoryMap.has(cIDX)) {
      inventoryMap.set(cIDX, {
        itemCount: 0,
        totalQty: 0
      })
    }

    const entry = inventoryMap.get(cIDX)

    entry.itemCount += 1
    entry.totalQty += inv.qty
  }

  /* ======================================================
     ENRICH INSTANCES (FIXED)
  ====================================================== */

  for (const container of instances) {

    let itemCount = 0
    let totalQty = 0

    /* =========================================
       DIRECT INVENTORY (if exists)
    ========================================= */

    const direct = inventoryMap.get(container.IDX)

    if (direct) {
      itemCount += direct.itemCount
      totalQty += direct.totalQty
    }

    /* =========================================
       CHILD INVENTORY (KEY FIX)
    ========================================= */

    const children = childMap.get(container.IDX) || []

    for (const childIDX of children) {

      const childInv = inventoryMap.get(childIDX)

      if (childInv) {
        itemCount += childInv.itemCount
        totalQty += childInv.totalQty
      }
    }

    container.inventorySummary = {
      itemCount,
      totalQty
    }

    container.inventoryCount = totalQty
  }

  return {
    success: true,
    instances
  }

})
