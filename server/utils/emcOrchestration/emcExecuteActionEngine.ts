import mongoose from "mongoose"
import { generateReferenceNumber } from "../emcGenerateReference"
/* ======================================================
   GENERIC VALUE RESOLVER
====================================================== */
function getValue(obj: any, path: string) {
  if (!obj || !path) return undefined

  return path
    .split(".")
    .reduce((acc, key) => acc?.[key], obj)
}

/* ======================================================
   GENERIC DISPLAY NAME RESOLVER
====================================================== */
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
    const value = getValue(row, path)
    if (value) return value
  }

  const titleRule =
    config?.ui?.listView?.find(
      (x: any) => x.isTitle
    )

  if (titleRule?.path) {
    const paths = Array.isArray(
      titleRule.path
    )
      ? titleRule.path
      : [titleRule.path]

    const parts = paths
      .map((p: string) =>
        getValue(row, p)
      )
      .filter(Boolean)

    if (parts.length) {
      return parts.join(
        titleRule.separator || " "
      )
    }
  }

  return row?.IDX || ""
}

/* ======================================================
   INVENTORY HELPERS
====================================================== */
async function addInventory(
  params: any
) {
  const {
    db,
    session,
    organizationId,
    containerType,
    containerIDX,
    productIDX,
    quantity,
    userContext
  } = params

  await db
    .collection(
      "emcContainerInventory"
    )
    .updateOne(
      {
        organizationId,
        containerIDX,
        productIDX
      },
      {
        $inc: {
          quantity: Number(
            quantity || 0
          )
        },
        $set: {
          containerType,
          updatedAt:
            new Date(),
          updatedBy:
            userContext?.userId
        },
        $setOnInsert: {
          createdAt:
            new Date()
        }
      },
      {
        upsert: true,
        session
      }
    )
}

async function reduceInventory(
  params: any
) {
  const {
    db,
    session,
    organizationId,
    containerIDX,
    productIDX,
    quantity
  } = params

  const rows = await db
    .collection(
      "emcContainerInventory"
    )
    .find(
      {
        organizationId,
        containerIDX,
        productIDX
      },
      { session }
    )
    .sort({
      createdAt: 1
    })
    .toArray()

  const total = rows.reduce(
    (
      sum: number,
      row: any
    ) =>
      sum +
      Number(
        row.quantity || 0
      ),
    0
  )

  if (total < quantity) {
    throw new Error(
      `Insufficient stock in ${containerIDX}`
    )
  }

  let remaining = Number(
    quantity || 0
  )

  for (const row of rows) {
    if (remaining <= 0) break

    const available =
      Number(
        row.quantity || 0
      )

    const deduct =
      Math.min(
        available,
        remaining
      )

    await db
      .collection(
        "emcContainerInventory"
      )
      .updateOne(
        { _id: row._id },
        {
          $inc: {
            quantity: -deduct
          },
          $set: {
            updatedAt:
              new Date()
          }
        },
        { session }
      )

    remaining -= deduct
  }

  await db
    .collection(
      "emcContainerInventory"
    )
    .deleteMany(
      {
        organizationId,
        containerIDX,
        productIDX,
        quantity: {
          $lte: 0
        }
      },
      { session }
    )
}

/* ======================================================
   AUTO SOURCE RESOLUTION
====================================================== */
async function resolveAndReduceSources(
  params: any
) {
  const {
    db,
    session,
    organizationId,
    orchestration,
    destinationContainer,
    productIDX,
    quantity
  } = params

  const sourceStrategy =
    orchestration?.sourceStrategy ||
    "NONE"

  if (
    sourceStrategy ===
    "PARENT"
  ) {
    const parentIDX =
      destinationContainer?.parentIDX

    if (!parentIDX) {
      throw new Error(
        `No parent container for source of ${productIDX}`
      )
    }

    await reduceInventory({
      db,
      session,
      organizationId,
      containerIDX:
        parentIDX,
      productIDX,
      quantity
    })

    return
  }

  if (
    sourceStrategy ===
    "NONE"
  ) {
    return
  }

  if (
    sourceStrategy ===
    "CONTAINERTYPE"
  ) {
    const rows = await db
      .collection(
        "emcContainerInventory"
      )
      .find(
        {
          organizationId,
          productIDX,
          quantity: {
            $gt: 0
          }
        },
        { session }
      )
      .sort({
        quantity: -1,
        createdAt: 1
      })
      .toArray()

    let remaining = Number(
      quantity || 0
    )

    const total = rows.reduce(
      (
        sum: number,
        row: any
      ) =>
        sum +
        Number(
          row.quantity || 0
        ),
      0
    )

    if (total < remaining) {
      throw new Error(
        `Insufficient stock for ${productIDX}`
      )
    }

    for (const row of rows) {
      if (remaining <= 0) break

      const available =
        Number(
          row.quantity || 0
        )

      const take =
        Math.min(
          available,
          remaining
        )

      await reduceInventory({
        db,
        session,
        organizationId,
        containerIDX:
          row.containerIDX,
        productIDX,
        quantity: take
      })

      remaining -= take
    }

    return
  }

  throw new Error(
    `Unsupported source strategy: ${sourceStrategy}`
  )
}

/* ======================================================
   MAIN ENGINE
====================================================== */
export default async function emcExecuteActionEngine(
  payload: any
) {
  const db =
    mongoose.connection.db

  const {
    organizationId,
    actionId,
    destination,
    containers = {},
    userContext,
    input = {}
  } = payload

  const destType =
    destination?.type

  const destIDX =
    destination?.idx

  if (
    !organizationId ||
    !actionId ||
    !destType ||
    !destIDX
  ) {
    throw new Error(
      "Missing required parameters"
    )
  }

  const session =
    await mongoose.startSession()

  session.startTransaction()

  try {
    const destConfig =
      await db
        .collection(
          "emcOrganizationContainerConfig"
        )
        .findOne({
          organizationId,
          type: destType
        })

    if (!destConfig) {
      throw new Error(
        "Destination config not found"
      )
    }

    const actionDef =
      destConfig.actions?.find(
        (a: any) =>
          a.id === actionId
      )

    if (!actionDef) {
      throw new Error(
        "Action not configured"
      )
    }

    if (
      actionDef.roles
        ?.length &&
      !actionDef.roles.includes(
        userContext?.role
      )
    ) {
      throw new Error(
        "Unauthorized action"
      )
    }

    const orchestration =
      actionDef.orchestration ||
      {}

    const movementType =
      orchestration.movementType ||
      "IN"

    const destCollection =
      destConfig.storage
        .collection

    const destKeyPath =
      destConfig.storage
        .primaryKey ||
      "IDX"

    const destOrgKey =
      destConfig.storage
        .organizationKey ||
      "organizationId"

    const destinationContainer =
      await db
        .collection(
          destCollection
        )
        .findOne({
          [destOrgKey]:
            organizationId,
          [destKeyPath]:
            destIDX
        })

    if (
      !destinationContainer
    ) {
      throw new Error(
        "Destination container not found"
      )
    }

    const previousLifecycle =
      destinationContainer.lifecycle ||
      {}

    const inventoryAudit: any[] =
      []

    const assignmentAudit: any[] = []

    let generatedReference: any = null

    /* ==========================================
       PROCESS CHILD TYPES
    ========================================== */

    for (const containerType in containers) {
      const containerPayload =
        containers[
        containerType
        ]

      const childConfig =
        await db
          .collection(
            "emcOrganizationContainerConfig"
          )
          .findOne({
            organizationId,
            type: containerType
          })

      if (!childConfig)
        continue

      const isInventoryManaged =
        childConfig.inventoryManaged ===
        true

      const childCollection =
        childConfig.storage
          .collection

      const keyPath =
        childConfig.storage
          .primaryKey ||
        "IDX"

      const orgKey =
        childConfig.storage
          .organizationKey ||
        "organizationId"

      /* ======================================
         INVENTORY
      ====================================== */

      if (
        isInventoryManaged
      ) {
        const quantities =
          containerPayload?.quantities ||
          {}

        for (const productIDX in quantities) {
          const qty = Number(
            quantities[
            productIDX
            ] || 0
          )

          if (qty <= 0)
            continue

          if (
            movementType ===
            "TRANSFER"
          ) {
            await resolveAndReduceSources(
              {
                db,
                session,
                organizationId,
                orchestration,
                destinationContainer,
                productIDX,
                quantity: qty
              }
            )
          }

          await addInventory({
            db,
            session,
            organizationId,
            containerType:
              destType,
            containerIDX:
              destIDX,
            productIDX,
            quantity: qty,
            userContext
          })

          let productName =
            productIDX

          try {
            const prod =
              await db
                .collection(
                  childCollection
                )
                .findOne({
                  [orgKey]:
                    organizationId,
                  [keyPath]:
                    productIDX
                })

            productName =
              resolveDisplayName(
                prod,
                childConfig
              ) ||
              productIDX
          } catch { }

          inventoryAudit.push({
            productIDX,
            productName,
            quantity: qty
          })
        }
      }

      /* ======================================
         STRUCTURAL
      ====================================== */

      else {
        const selected =
          containerPayload.children ||
          containerPayload.items ||
          []

        const currentlyAssigned =
          await db
            .collection(
              childCollection
            )
            .find({
              [orgKey]:
                organizationId,
              parentIDX:
                destIDX,
              parentType:
                destType
            })
            .toArray()

        const currentIDXs =
          currentlyAssigned.map(
            (row: any) =>
              getValue(
                row,
                keyPath
              )
          )

        const removed =
          currentIDXs.filter(
            (idx: any) =>
              !selected.includes(
                idx
              )
          )

        for (const row of currentlyAssigned) {
          const rowIDX =
            getValue(
              row,
              keyPath
            )

          if (
            !removed.includes(
              rowIDX
            )
          ) {
            continue
          }

          await db
            .collection(
              childCollection
            )
            .updateOne(
              {
                [orgKey]:
                  organizationId,
                [keyPath]:
                  rowIDX
              },
              {
                $set: {
                  parentIDX:
                    row.previousParentIDX ||
                    null,
                  parentType:
                    row.previousParentType ||
                    null,
                  updatedAt:
                    new Date(),
                  updatedBy:
                    userContext?.userId
                },
                $unset: {
                  previousParentIDX:
                    "",
                  previousParentType:
                    ""
                }
              },
              { session }
            )

          assignmentAudit.push({
            type:
              containerType,
            action:
              "UNASSIGNED",
            idx: rowIDX,
            name:
              resolveDisplayName(
                row,
                childConfig
              )
          })
        }

        for (const childIDX of selected) {
          if (
            currentIDXs.includes(
              childIDX
            )
          ) {
            continue
          }

          const existing =
            await db
              .collection(
                childCollection
              )
              .findOne({
                [orgKey]:
                  organizationId,
                [keyPath]:
                  childIDX
              })

          await db
            .collection(
              childCollection
            )
            .updateOne(
              {
                [orgKey]:
                  organizationId,
                [keyPath]:
                  childIDX
              },
              {
                $set: {
                  previousParentIDX:
                    existing?.parentIDX ||
                    null,
                  previousParentType:
                    existing?.parentType ||
                    null,
                  parentIDX:
                    destIDX,
                  parentType:
                    destType,
                  updatedAt:
                    new Date(),
                  updatedBy:
                    userContext?.userId
                }
              },
              { session }
            )

          assignmentAudit.push({
            type:
              containerType,
            action:
              "ASSIGNED",
            idx: childIDX,
            name:
              resolveDisplayName(
                existing,
                childConfig
              )
          })
        }
      }
    }

    /* ==========================================
       LIFECYCLE
    ========================================== */

    const lifecycleUpdates: any =
      {}

    const historyEntry: any = {
      updatedBy:
        userContext?.userId,
      updatedAt:
        new Date(),
      remarks:
        input?.remarks || ""
    }

    if (
      actionId ===
      "CHANGE_STATUS" &&
      input?.track &&
      input?.status
    ) {
      const oldValue =
        previousLifecycle?.[
        input.track
        ]

      lifecycleUpdates[
        input.track
      ] = input.status

      historyEntry[
        input.track
      ] = {
        from: oldValue,
        to: input.status
      }
    } else if (
      actionDef?.tracks
    ) {
      for (const t of actionDef.tracks) {
        const oldValue =
          previousLifecycle?.[
          t.track
          ]

        lifecycleUpdates[
          t.track
        ] = t.to

        historyEntry[
          t.track
        ] = {
          from: oldValue,
          to: t.to
        }
      }
    }

    if (
      Object.keys(
        lifecycleUpdates
      ).length
    ) {
      historyEntry.actionId =
        actionId

      await db
        .collection(
          destCollection
        )
        .updateOne(
          {
            [destOrgKey]:
              organizationId,
            [destKeyPath]:
              destIDX
          },
          {
            $set:
              Object.fromEntries(
                Object.entries(
                  lifecycleUpdates
                ).map(
                  ([k, v]) => [
                    `lifecycle.${k}`,
                    v
                  ]
                )
              ),
            $push: {
              "lifecycle.history":
                historyEntry
            }
          },
          { session }
        )
    }

    /* ==========================================
       AUDIT
    ========================================== */

    await db
      .collection(
        "emcAuditLogs"
      )
      .insertOne(
        {
          organizationId,
          entityType:
            destType,
          entityIDX:
            destIDX,
          actionId,
          performedBy: {
            userId:
              userContext?.userId,
            role:
              userContext?.role
          },
          timestamp:
            new Date(),
          remarks:
            input?.remarks || "",
          details: {
            inventory:
              inventoryAudit,
            assignments:
              assignmentAudit
          }
        },
        { session }
      )

    /* =====================================
       REFERENCE DATA (BCL ETC)
    ===================================== */

    if (
      actionDef.referenceData
    ) {
      const refConfig =
        actionDef.referenceData

      let referenceNumber =
        null

      if (
        refConfig.generateReferenceNumber
      ) {
        referenceNumber =
          await generateReferenceNumber(
            organizationId,
            refConfig.type
          )
      }

      let snapshot: any[] = []

      if (
        refConfig.dataSource ===
        "inventorySnapshot"
      ) {
        const inv = await db
          .collection(
            "emcContainerInventory"
          )
          .find(
            {
              organizationId,
              containerType:
                destType,
              containerIDX:
                destIDX,
              quantity: {
                $gt: 0
              }
            },
            { session }
          )
          .toArray()

        snapshot = inv.map(
          (i: any) => ({
            productIDX:
              i.productIDX,
            quantity:
              i.quantity
          })
        )
      }

      await db
        .collection(
          "emcActionReferenceData"
        )
        .insertOne(
          {
            organizationId,
            containerType:
              destType,
            containerIDX:
              destIDX,
            actionId,

            referenceType:
              refConfig.type,

            referenceNumber,

            version: 1,

            binding: {
              channel:
                refConfig.channel ||
                "compliance",

              visibleWhenStates:
                refConfig.visibleWhenStates ||
                []
            },

            data: {
              inventorySnapshot:
                snapshot,
              input
            },

            createdBy:
              userContext?.userId ||
              "SYSTEM",

            createdAt:
              new Date(),

            updatedAt:
              new Date()
          },
          { session }
        )

      generatedReference = {
        referenceType:
          refConfig.type,
        referenceNumber
      }
    }

    await session.commitTransaction()

    return {
      success: true,
      ...(generatedReference || {})
    }
  } catch (err) {
    await session.abortTransaction()
    throw err
  } finally {
    await session.endSession()
  }
}
