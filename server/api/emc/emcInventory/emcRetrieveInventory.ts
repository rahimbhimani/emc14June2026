import mongoose from "mongoose"

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const {
    organizationId,
    containerType,
    containerIDX
  } = body || {}

  if (
    !organizationId ||
    !containerType ||
    !containerIDX
  ) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Missing parameters"
    })
  }

  const db =
    mongoose.connection.db

  /* ======================================================
     HELPERS
  ====================================================== */

  function getValue(
    obj: any,
    path: string
  ) {
    if (!obj || !path)
      return undefined

    return path
      .split(".")
      .reduce(
        (
          acc: any,
          key: string
        ) => acc?.[key],
        obj
      )
  }

  function getFlag(
    config: any,
    key: string,
    defaultValue = true
  ) {
    let value

    if (
      config?.config?.[key] !== undefined
    ) {
      value = config.config[key]
    }
    else if (
      config?.ui?.[key] !== undefined
    ) {
      value = config.ui[key]
    }
    else if (
      config?.[key] !== undefined
    ) {
      value = config[key]
    }
    else {
      return defaultValue
    }

    if (typeof value === "string") {
      const normalized =
        value
          .trim()
          .toLowerCase()

      if (normalized === "true")
        return true

      if (normalized === "false")
        return false
    }

    return Boolean(value)
  }

  function resolveDisplayName(
    row: any,
    config: any
  ) {
    if (!row) return ""

    const candidates = [
      "Name",
      "title",
      "label",
      "tbMain.Name",
      "FullName"
    ]

    for (const path of candidates) {
      const value =
        getValue(
          row,
          path
        )

      if (value) return value
    }

    const titleRule =
      config?.ui?.listView?.find(
        (x: any) =>
          x.isTitle
      )

    if (titleRule?.path) {
      const paths =
        Array.isArray(
          titleRule.path
        )
          ? titleRule.path
          : [titleRule.path]

      const parts = paths
        .map(
          (p: string) =>
            getValue(
              row,
              p
            )
        )
        .filter(Boolean)

      if (parts.length) {
        return parts.join(
          titleRule.separator ||
          " "
        )
      }
    }

    return row?.IDX || ""
  }

  async function getInventory(
    targetContainerIDX: string
  ) {
    return await db
      .collection(
        "emcContainerInventory"
      )
      .find({
        organizationId,
        containerIDX:
          targetContainerIDX
      })
      .toArray()
  }

  function summarizeInventory(
    records: any[]
  ) {
    const map = new Map()

    for (const inv of records) {
      const key =
        inv.productIDX

      const prev =
        map.get(key) || 0

      map.set(
        key,
        prev +
        Number(
          inv.quantity || 0
        )
      )
    }

    const itemCount =
      map.size

    const quantity =
      Array.from(
        map.values()
      ).reduce(
        (
          a: number,
          b: any
        ) =>
          a +
          Number(
            b || 0
          ),
        0
      )

    return {
      itemCount,
      quantity
    }
  }

  /* ======================================================
     LOAD PARENT CONFIG
  ====================================================== */

  const containerConfig =
    await db
      .collection(
        "emcOrganizationContainerConfig"
      )
      .findOne({
        organizationId,
        type:
          containerType
      })

  if (!containerConfig) {
    return {
      success: true,
      items: {}
    }
  }

  const result: any = {}

  /* ======================================================
     LOOP CHILD TYPES
  ====================================================== */

  for (const rule of containerConfig.canContainRules || []) {
    const childType =
      rule.childType

    const childConfig =
      await db
        .collection(
          "emcOrganizationContainerConfig"
        )
        .findOne({
          organizationId,
          type: childType
        })

    if (!childConfig)
      continue

    const childCollection =
      childConfig
        ?.storage
        ?.collection

    if (!childCollection)
      continue

    /* ======================================================
       INVENTORY MANAGED CHILD
    ====================================================== */

    if (
      childConfig.inventoryManaged ===
      true
    ) {
      const records =
        await getInventory(
          containerIDX
        )

      const keyPath =
        childConfig
          ?.storage
          ?.primaryKey ||
        "IDX"

      const orgKey =
        childConfig
          ?.storage
          ?.organizationKey ||
        "organizationId"

      const masters =
        await db
          .collection(
            childCollection
          )
          .find({
            [orgKey]:
              organizationId
          })
          .toArray()

      const nameMap = new Map()

      for (const row of masters) {
        const idx =
          getValue(
            row,
            keyPath
          ) || row.IDX

        if (!idx) continue

        nameMap.set(
          String(idx),
          resolveDisplayName(
            row,
            childConfig
          )
        )
      }

      result[childType] =
        records.map(
          (r: any) => {
            const idx =
              r.productIDX

            const label =
              nameMap.get(
                String(idx)
              ) ||
              r.productName ||
              r.Name ||
              idx

            return {
              idx,
              label,
              subLabel: idx,
              quantity:
                Number(
                  r.quantity || 0
                )
            }
          }
        )

      continue
    }

    /* ======================================================
       STRUCTURAL CHILD
    ====================================================== */

    const keyPath =
      childConfig
        ?.storage
        ?.primaryKey ||
      "IDX"

    const orgKey =
      childConfig
        ?.storage
        ?.organizationKey ||
      "organizationId"

    const childRows =
      await db
        .collection(
          childCollection
        )
        .find({
          [orgKey]:
            organizationId,
          parentIDX:
            containerIDX
        })
        .toArray()

    const rows: any[] = []

    for (const child of childRows) {
      const childIDX =
        getValue(
          child,
          keyPath
        ) || child.IDX

      const inventory =
        await getInventory(
          childIDX
        )

      const summary =
        summarizeInventory(
          inventory
        )

      const row: any = {
        idx: childIDX,
        label:
          resolveDisplayName(
            child,
            childConfig
          ),
        subLabel: childIDX
      }

      if (
        getFlag(
          childConfig,
          "showItemCount"
        ) === true
      ) {
        row.itemCount =
          summary.itemCount
      }

      if (
        getFlag(
          childConfig,
          "showQuantity"
        ) === true
      ) {
        row.quantity =
          summary.quantity
      }

      rows.push(row)
    }

    result[childType] =
      rows
  }

  return {
    success: true,
    items: result
  }
})
