import mongoose from "mongoose"

function getValueByPath(obj: any, path: string) {
  if (!obj || !path) return undefined

  return path
    .split(".")
    .reduce((acc, key) => acc?.[key], obj)
}

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

  /* ==========================================
     LOAD CONFIG
  ========================================== */

  const config = await db
    .collection("emcOrganizationContainerConfig")
    .findOne({
      organizationId,
      type
    })

  if (!config) {
    return {
      success: true,
      instances: []
    }
  }

  /* ==========================================
     LOAD MAIN INSTANCES
  ========================================== */

  const instances = await db
    .collection(config.storage.collection)
    .find({
      [config.storage.organizationKey]:
        organizationId
    })
    .toArray()

  if (!instances.length) {
    return {
      success: true,
      instances: []
    }
  }

  /* ==========================================
     LOAD REFERENCE DATA
  ========================================== */

  const refs = await db
    .collection("emcActionReferenceData")
    .find({
      organizationId,
      containerType: type
    })
    .sort({ createdAt: 1 })
    .toArray()

  const referenceMap = new Map()

  for (const ref of refs) {
    const idx = ref.containerIDX

    if (!referenceMap.has(idx)) {
      referenceMap.set(idx, [])
    }

    referenceMap.get(idx).push(ref)
  }

  /* ==========================================
     INVENTORY AGGREGATION
  ========================================== */

  const inventoryAgg = await db
    .collection("emcContainerInventory")
    .aggregate([
      {
        $match: { organizationId }
      },
      {
        $group: {
          _id: {
            containerIDX:
              "$containerIDX",
            productIDX:
              "$productIDX"
          },
          qty: {
            $sum: "$quantity"
          }
        }
      }
    ])
    .toArray()

  const inventoryMap = new Map()

  for (const row of inventoryAgg) {
    const containerIDX =
      row._id.containerIDX

    if (!inventoryMap.has(containerIDX)) {
      inventoryMap.set(
        containerIDX,
        {
          itemCount: 0,
          totalQty: 0
        }
      )
    }

    const target =
      inventoryMap.get(containerIDX)

    target.itemCount += 1
    target.totalQty += Number(
      row.qty || 0
    )
  }

  /* ==========================================
     BUILD CHILD MAPS
  ========================================== */

  const childMaps: any[] = []

  for (const rule of config.canContainRules || []) {
    const childType = rule.childType

    const childConfig = await db
      .collection(
        "emcOrganizationContainerConfig"
      )
      .findOne({
        organizationId,
        type: childType
      })

    if (!childConfig) continue

    const childRows = await db
      .collection(
        childConfig.storage.collection
      )
      .find({
        [childConfig.storage.organizationKey]:
          organizationId
      })
      .toArray()

    const map = new Map()

    for (const child of childRows) {
      const parentIDX =
        child.parentIDX

      if (!parentIDX) continue

      const childIDX =
        getValueByPath(
          child,
          childConfig.storage.primaryKey || "IDX"
        )

      if (!childIDX) continue

      if (!map.has(parentIDX)) {
        map.set(parentIDX, [])
      }

      map.get(parentIDX).push({
        childIDX,
        childType
      })
    }

    childMaps.push(map)
  }

  /* ==========================================
     ENRICH MAIN INSTANCES
  ========================================== */

  const mainPK =
    config.storage.primaryKey || "IDX"

  for (const row of instances) {
    const rowIDX =
      getValueByPath(row, mainPK)

    let itemCount = 0
    let totalQty = 0
    let linkedCount = 0

    const direct =
      inventoryMap.get(rowIDX)

    if (direct) {
      itemCount += direct.itemCount
      totalQty += direct.totalQty
    }

    for (const map of childMaps) {
      const linked =
        map.get(rowIDX) || []

      linkedCount += linked.length

      for (const child of linked) {
        const childInv =
          inventoryMap.get(
            child.childIDX
          )

        if (childInv) {
          itemCount +=
            childInv.itemCount

          totalQty +=
            childInv.totalQty
        }
      }
    }

    row.inventorySummary = {
      itemCount,
      totalQty
    }

    row.childSummary = {
      count: linkedCount
    }

    row.inventoryCount = totalQty

    /* NEW: attach references */
    row.references =
      referenceMap.get(rowIDX) || []
  }

  return {
    success: true,
    instances
  }
})
