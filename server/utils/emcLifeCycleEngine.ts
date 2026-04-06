import { randomUUID } from "crypto"
import mongoose from "mongoose"

/* ======================================================
   BACKWARD COMPATIBILITY FOR lifecycleRuleManager
====================================================== */

const lifecycleRuleCache = new Map<string, any>()

export function invalidateRuleCache(
  action?: string,
  entityType?: string
) {
  lifecycleRuleCache.clear()
}

export function getRuleCacheStats() {
  return {
    size: lifecycleRuleCache.size,
    keys: Array.from(lifecycleRuleCache.keys())
  }
}

/* ======================================================
   PUBLIC ENTRY POINT
====================================================== */

interface ExecuteParams {
  organizationId: number
  containerType: string
  containerIDX: string
  actionId: string
  payload?: any
  userContext: {
    userId: string
    role: string
  }
}

export async function emcExecuteLifecycleAction(
  params: ExecuteParams
) {

  const {
    organizationId,
    containerType,
    containerIDX,
    actionId,
    payload,
    userContext
  } = params

  const db = mongoose.connection.db
  const correlationId = randomUUID()

  /* ======================================================
     LOAD CONFIG
  ====================================================== */

  const config = await db.collection("emcOrganizationContainerConfig")
    .findOne({ organizationId, type: containerType })

  if (!config) throw new Error("Container config not found")

  const collectionName = config.storage.collection
  const primaryKey = config.storage.primaryKey

  /* ======================================================
     LOAD MASTER CONTAINER
  ====================================================== */

  const master = await db.collection(collectionName).findOne({
    organizationId,
    [primaryKey]: containerIDX
  })

  if (!master) throw new Error("Container not found")

  const beforeLifecycle = { ...master.lifecycle }

  /* ======================================================
     LOAD ACTION DEFINITION
  ====================================================== */

  const actionDef = config.actions?.find(
    (a: any) => a.id === actionId
  )

  if (!actionDef)
    throw new Error("Action not configured")

  /* ======================================================
     ROLE VALIDATION (HARD ENFORCEMENT)
  ====================================================== */

  if (actionDef.roles &&
    !actionDef.roles.includes(userContext.role)) {
    throw new Error("User not authorized")
  }

  /* ======================================================
     LIFECYCLE VALIDATION (TRACKS-BASED)
  ====================================================== */

  for (const trackDef of actionDef.tracks || []) {

    const currentState =
      master.lifecycle?.[trackDef.track]

    if (currentState !== trackDef.from) {
      throw new Error(
        `Invalid lifecycle transition on track ${trackDef.track}`
      )
    }
  }

  /* ======================================================
     OPTIONAL CONDITION VALIDATION
  ====================================================== */

  if (actionDef.conditions) {
    await validateConditions({
      db,
      organizationId,
      containerType,
      containerIDX,
      master,
      conditions: actionDef.conditions,
      payload
    })
  }

  /* ======================================================
     START TRANSACTION
  ====================================================== */

  const session = await mongoose.startSession()
  session.startTransaction()

  try {

    /* ======================================================
       APPLY LIFECYCLE TRANSITIONS
    ====================================================== */

    const lifecycleUpdates: any = {}

    for (const trackDef of actionDef.tracks || []) {
      lifecycleUpdates[`lifecycle.${trackDef.track}`] =
        trackDef.to
    }

    if (Object.keys(lifecycleUpdates).length > 0) {

      await db.collection(collectionName).updateOne(
        { organizationId, [primaryKey]: containerIDX },
        {
          $set: {
            ...lifecycleUpdates,
            updatedAt: new Date(),
            updatedBy: userContext.userId
          }
        },
        { session }
      )
    }

    const afterLifecycle = {
      ...beforeLifecycle,
      ...Object.fromEntries(
        Object.entries(lifecycleUpdates).map(
          ([k, v]) => [k.split(".")[1], v]
        )
      )
    }

    /* ======================================================
       CHILD EFFECTS
    ====================================================== */

    const childResults: any[] = []

    for (const childEffect of actionDef.childEffects || []) {

      const childConfig = await db.collection(
        "emcOrganizationContainerConfig"
      ).findOne({
        organizationId,
        type: childEffect.childType
      })

      if (!childConfig) continue

      const childCollection =
        childConfig.storage.collection
      const childPrimaryKey =
        childConfig.storage.primaryKey
      const parentField =
        childConfig.storage.parentField

      const children = await db.collection(childCollection)
        .find({
          organizationId,
          [parentField]: containerIDX
        })
        .toArray()

      for (const child of children) {

        const beforeChild =
          { ...child.lifecycle }

        await db.collection(childCollection).updateOne(
          {
            organizationId,
            [childPrimaryKey]:
              child[childPrimaryKey]
          },
          {
            $set: {
              [`lifecycle.${childEffect.track}`]:
                childEffect.to
            }
          },
          { session }
        )

        childResults.push({
          type: childEffect.childType,
          IDX: child[childPrimaryKey],
          beforeLifecycle: beforeChild,
          afterLifecycle: {
            ...beforeChild,
            [childEffect.track]:
              childEffect.to
          }
        })
      }
    }

    /* ======================================================
       PLUGIN EXECUTION
    ====================================================== */

    if (actionDef.plugin) {
      await executePlugin({
        pluginName: actionDef.plugin,
        db,
        session,
        organizationId,
        containerType,
        containerIDX,
        master,
        payload,
        userContext,
        correlationId
      })
    }

    /* ======================================================
       WRITE HISTORY
    ====================================================== */

    await db.collection("emcLifecycleHistory")
      .insertOne({
        organizationId,
        correlationId,
        actionId,
        master: {
          type: containerType,
          IDX: containerIDX,
          fromLifecycle: beforeLifecycle,
          toLifecycle: afterLifecycle
        },
        children: childResults,
        payload: payload || null,
        executedBy: userContext.userId,
        executedAt: new Date()
      }, { session })

    /* ======================================================
       WRITE AUDIT
    ====================================================== */

    await db.collection("emcLifecycleAudit")
      .insertOne({
        organizationId,
        correlationId,
        actionId,
        master: {
          type: containerType,
          IDX: containerIDX,
          beforeLifecycle: beforeLifecycle,
          afterLifecycle: afterLifecycle
        },
        children: childResults,
        payload,
        userContext,
        status: "SUCCESS",
        executedAt: new Date()
      }, { session })

    await session.commitTransaction()
    session.endSession()

    return {
      success: true,
      correlationId
    }

  } catch (error: any) {

    await session.abortTransaction()
    session.endSession()

    await db.collection("emcLifecycleAudit")
      .insertOne({
        organizationId,
        correlationId,
        actionId,
        master: {
          type: containerType,
          IDX: containerIDX,
          beforeLifecycle: beforeLifecycle,
          afterLifecycle: null
        },
        payload,
        userContext,
        status: "FAILED",
        error: error.message,
        executedAt: new Date()
      })

    throw error
  }
}

/* ======================================================
   PLUGIN EXECUTOR
====================================================== */

async function executePlugin({
  pluginName,
  db,
  session,
  organizationId,
  containerType,
  containerIDX,
  payload,
  userContext,
  correlationId
}: any) {

  switch (pluginName) {

    case "inventory.instock":
      await inventoryInstock({
        db,
        session,
        organizationId,
        containerType,
        containerIDX,
        payload,
        userContext,
        correlationId
      })
      break

    default:
      throw new Error(
        `Plugin ${pluginName} not found`
      )
  }
}

/* ======================================================
   INVENTORY INSTOCK
====================================================== */

async function inventoryInstock({
  db,
  session,
  organizationId,
  containerType,
  containerIDX,
  payload,
  userContext,
  correlationId
}: any) {

  const { quantities = {}, selectedChildren = [] } = payload || {}

  /* ======================================================
     1️⃣ HANDLE INVENTORY (PRODUCTS)
  ====================================================== */

  for (const productIDX of Object.keys(quantities)) {

    const qty = Number(quantities[productIDX] || 0)
    if (qty <= 0) continue

    const existing = await db.collection("emcContainerInventory")
      .findOne({
        organizationId,
        containerType,
        containerIDX,
        productIDX
      }, { session })

    if (existing) {
      await db.collection("emcContainerInventory")
        .updateOne(
          { _id: existing._id },
          {
            $set: {
              quantity: existing.quantity + qty,
              updatedAt: new Date(),
              updatedBy: userContext.userId
            }
          },
          { session }
        )
    } else {
      await db.collection("emcContainerInventory")
        .insertOne(
          {
            organizationId,
            containerType,
            containerIDX,
            productIDX,
            quantity: qty,
            createdAt: new Date(),
            updatedAt: new Date(),
            updatedBy: userContext.userId
          },
          { session }
        )
    }

    await db.collection("emcInventoryHistory").insertOne({
      organizationId,
      correlationId,
      productIDX,
      fromContainer: null,
      toContainer: {
        type: containerType,
        IDX: containerIDX
      },
      quantity: qty,
      action: "INSTOCK",
      executedBy: userContext.userId,
      executedAt: new Date()
    }, { session })
  }

  /* ======================================================
     2️⃣ HANDLE STRUCTURAL CHILDREN (TROLLEY)
  ====================================================== */

  for (const childIDX of selectedChildren) {

    const childConfig = await db
      .collection("emcOrganizationContainerConfig")
      .findOne({ organizationId, type: "Trolley" })

    if (!childConfig) continue

    const childCollection = childConfig.storage.collection
    const primaryKey = childConfig.storage.primaryKey

    await db.collection(childCollection)
      .updateOne(
        {
          organizationId,
          [primaryKey]: childIDX
        },
        {
          $set: {
            parentContainerType: containerType,
            parentContainerIDX: containerIDX,
            updatedAt: new Date(),
            updatedBy: userContext.userId
          }
        },
        { session }
      )
  }
}

/* ======================================================
   CONDITION VALIDATOR (EXTENSIBLE)
====================================================== */

async function validateConditions({
  db,
  conditions
}: any) {

  for (const condition of conditions || []) {

    switch (condition.type) {
      default:
        throw new Error(
          `Unknown condition type: ${condition.type}`
        )
    }
  }
}
