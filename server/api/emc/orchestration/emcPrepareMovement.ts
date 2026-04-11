import mongoose from "mongoose"

function getValueByPath(obj: any, path: string) {
  if (!obj || !path) return undefined

  return path
    .split(".")
    .reduce((acc, key) => acc?.[key], obj)
}

function buildListView(item: any, config: any) {
  const output: any = {}
  const fields = config.ui?.listView || []

  for (const field of fields) {
    let value

    if (Array.isArray(field.path)) {
      value = field.path
        .map((p: string) => getValueByPath(item, p))
        .filter(v => v !== undefined && v !== null && v !== "")
        .join(field.separator || " ")
    } else {
      value = getValueByPath(item, field.path)
    }

    output[field.label] = value ?? null
  }

  return output
}

function getTitleFromListView(listView: any, config: any) {
  const titleField = config.ui?.listView?.find(
    (f: any) => f.isTitle
  )

  return titleField
    ? listView[titleField.label]
    : null
}

function getPrimaryKeyValue(
  row: any,
  config: any
) {
  const keyPath =
    config?.storage?.primaryKey || "IDX"

  return getValueByPath(row, keyPath)
}

function sumInventoryForContainer(
  allInventory: any[],
  containerIDX: string
) {
  return allInventory
    .filter(
      inv =>
        inv.containerIDX === containerIDX &&
        Number(inv.quantity || 0) > 0
    )
    .reduce(
      (sum, inv) =>
        sum + Number(inv.quantity || 0),
      0
    )
}

export default async function emcPrepareMovement(
  payload: any
) {
  const {
    organizationId,
    destinationType,
    destinationIDX,
    actionId
  } = payload || {}

  if (
    !organizationId ||
    !destinationType ||
    !destinationIDX ||
    !actionId
  ) {
    throw new Error(
      "Missing required parameters"
    )
  }

  const db = mongoose.connection.db

  if (!db) {
    throw new Error(
      "Database connection not ready"
    )
  }

  /* ==========================================
     DESTINATION CONFIG
  ========================================== */

  const destinationConfig = await db
    .collection(
      "emcOrganizationContainerConfig"
    )
    .findOne({
      organizationId,
      type: destinationType
    })

  if (!destinationConfig) {
    throw new Error(
      "Destination config not found"
    )
  }

  const actionDef =
    destinationConfig.actions?.find(
      (a: any) => a.id === actionId
    )

  if (!actionDef) {
    throw new Error(
      "Action not configured"
    )
  }

  const orchestration =
    actionDef.orchestration || {}

  const sourceStrategy =
    orchestration.sourceStrategy ||
    "NONE"

  const allowInventory =
    orchestration.inventory === true

  const allowStructural =
    orchestration.structural === true

  const groupedChildren: any = {}

  /* ==========================================
     DESTINATION ROW
  ========================================== */

  const destinationRow = await db
    .collection(
      destinationConfig.storage.collection
    )
    .findOne({
      organizationId,
      [destinationConfig.storage.primaryKey]:
        destinationIDX
    })

  const parentIDX =
    destinationRow?.parentIDX || null

  /* ==========================================
     INVENTORY LOAD ONCE
  ========================================== */

  const allInventory = await db
    .collection("emcContainerInventory")
    .find({ organizationId })
    .toArray()

  /* ==========================================
     LOOP CHILD TYPES
  ========================================== */

  for (const rule of destinationConfig.canContainRules ||
    []) {
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

    const isInventoryManaged =
      childConfig.inventoryManaged === true

    if (
      isInventoryManaged &&
      !allowInventory
    ) {
      continue
    }

    if (
      !isInventoryManaged &&
      !allowStructural
    ) {
      continue
    }

    const childRows = await db
      .collection(
        childConfig.storage.collection
      )
      .find({
        [childConfig.storage
          .organizationKey]:
          organizationId
      })
      .toArray()

    const items: any[] = []

    /* ======================================
       INVENTORY MANAGED
    ====================================== */

    if (isInventoryManaged) {
      const currentMap = new Map()
      const parentMap = new Map()

      for (const inv of allInventory) {
        const qty = Number(
          inv.quantity || 0
        )

        if (
          inv.containerIDX ===
          destinationIDX
        ) {
          currentMap.set(
            inv.productIDX,
            (currentMap.get(
              inv.productIDX
            ) || 0) + qty
          )
        }

        if (
          sourceStrategy ===
          "PARENT" &&
          parentIDX &&
          inv.containerIDX === parentIDX
        ) {
          parentMap.set(
            inv.productIDX,
            (parentMap.get(
              inv.productIDX
            ) || 0) + qty
          )
        }
      }

      for (const row of childRows) {
        const IDX =
          getPrimaryKeyValue(
            row,
            childConfig
          )

        if (!IDX) continue

        const listView =
          buildListView(
            row,
            childConfig
          )

        const Name =
          getTitleFromListView(
            listView,
            childConfig
          ) || String(IDX)

        const currentQuantity =
          currentMap.get(IDX) || 0

        let totalInventory = 0
        let totalAvailable = 0
        let sources: any[] = []

        for (const inv of allInventory) {
          const qty = Number(
            inv.quantity || 0
          )

          if (
            inv.productIDX === IDX &&
            qty > 0
          ) {
            totalInventory += qty
          }
        }

        totalAvailable =
          totalInventory

        if (
          sourceStrategy ===
          "PARENT"
        ) {
          totalAvailable =
            parentMap.get(IDX) || 0
        }

        if (
          sourceStrategy ===
          "CONTAINERTYPE"
        ) {
          totalAvailable = 0
          sources = []

          for (const inv of allInventory) {
            const qty = Number(
              inv.quantity || 0
            )

            if (
              inv.productIDX !== IDX ||
              qty <= 0
            ) {
              continue
            }

            totalAvailable += qty

            sources.push({
              containerIDX:
                inv.containerIDX,
              containerType:
                inv.containerType,
              available: qty
            })
          }
        }

        items.push({
          IDX,
          Name,
          currentQuantity,
          totalInventory,
          totalAvailable,
          ...(sources.length
            ? { sources }
            : {})
        })
      }
    }

    /* ======================================
       STRUCTURAL
    ====================================== */

    if (!isInventoryManaged) {
      let filteredRows = childRows

      const visibilityRule =
        actionDef.childVisibility?.find(
          (v: any) =>
            v.childType === childType
        )

      if (
        visibilityRule?.allowedLifecycle
      ) {
        filteredRows =
          filteredRows.filter(
            (row: any) => {
              for (const track in visibilityRule.allowedLifecycle) {
                const allowed =
                  visibilityRule
                    .allowedLifecycle[
                  track
                  ]

                const current =
                  row.lifecycle?.[
                  track
                  ]

                if (
                  !allowed.includes(
                    current
                  )
                ) {
                  return false
                }
              }

              return true
            }
          )
      }

      filteredRows =
        filteredRows.filter(
          (row: any) =>
            !row.parentIDX ||
            row.parentIDX ===
            destinationIDX
        )

      for (const row of filteredRows) {
        const IDX =
          getPrimaryKeyValue(
            row,
            childConfig
          )

        if (!IDX) continue

        const listView =
          buildListView(
            row,
            childConfig
          )

        const Name =
          getTitleFromListView(
            listView,
            childConfig
          ) || String(IDX)

        const itemCount =
          sumInventoryForContainer(
            allInventory,
            String(IDX)
          )

        items.push({
          IDX,
          Name,
          itemCount,
          assignedHere:
            row.parentIDX ===
            destinationIDX,
          parentIDX:
            row.parentIDX ||
            null
        })
      }
    }

    groupedChildren[childType] = {
      config: {
        inventoryManaged:
          isInventoryManaged,
        label:
          childConfig.label ||
          childType,
        showItemCount:
          childConfig.ui
            ?.showItemCount !==
          false
      },
      items
    }
  }

  return {
    groupedChildren,
    orchestration
  }
}
