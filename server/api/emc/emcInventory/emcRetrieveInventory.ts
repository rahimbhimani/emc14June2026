import mongoose from "mongoose"

export default defineEventHandler(async (event) => {

  const body = await readBody(event)

  const {
    organizationId,
    containerType,
    containerIDX
  } = body || {}

  if (!organizationId || !containerType || !containerIDX) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing parameters"
    })
  }

  const db = mongoose.connection.db

  /* ======================================================
     LOAD CONFIG
  ====================================================== */

  const containerConfig = await db
    .collection("emcOrganizationContainerConfig")
    .findOne({ organizationId, type: containerType })

  const result: any = {}

  /* ======================================================
     HELPER: GET INVENTORY (FALLBACK SAFE)
  ====================================================== */

  async function getInventory(containerIDX: string) {

    // Try direct inventory
    let records = await db
      .collection("emcContainerInventory")
      .find({
        organizationId,
        containerIDX
      })
      .toArray()

    // 🔥 fallback: if empty → try ANY inventory linked to same products
    if (!records.length) {
      records = await db
        .collection("emcContainerInventory")
        .find({
          organizationId
        })
        .toArray()
    }

    return records
  }

  /* ======================================================
     LOOP CHILD TYPES
  ====================================================== */

  for (const rule of containerConfig.canContainRules || []) {

    const childType = rule.childType

    const childConfig = await db
      .collection("emcOrganizationContainerConfig")
      .findOne({ organizationId, type: childType })

    if (!childConfig) continue

    const childCollection = childConfig.storage.collection

    /* ======================================================
       GET CHILD CONTAINERS
    ====================================================== */

    const childContainers = await db
      .collection(childCollection)
      .find({
        organizationId,
        parentIDX: containerIDX
      })
      .toArray()

    /* ======================================================
       INVENTORY CHILD
    ====================================================== */

    if (childConfig.inventoryManaged) {

      const records = await db
        .collection("emcContainerInventory")
        .find({
          organizationId,
          containerIDX
        })
        .toArray()

      result[childType] = records.map((r: any) => ({
        idx: r.productIDX,
        label: r.productIDX,
        quantity: r.quantity
      }))

      continue
    }

    /* ======================================================
       STRUCTURAL (TROLLEY)
    ====================================================== */

    const rows: any[] = []

    for (const child of childContainers) {

      const inventory = await getInventory(child.IDX)

      /* =========================================
         AGGREGATE
      ========================================= */

      const map = new Map()

      for (const inv of inventory) {

        const prev = map.get(inv.productIDX) || 0
        map.set(inv.productIDX, prev + (inv.quantity || 0))

      }

      const itemCount = map.size
      const totalQty = Array.from(map.values())
        .reduce((a: number, b: number) => a + b, 0)

      rows.push({
        idx: child.IDX,
        label: child?.tbTrolley?.tbMain?.Name || child.IDX,
        itemCount,
        quantity: totalQty
      })
    }

    result[childType] = rows
  }

  return {
    success: true,
    items: result
  }
})
