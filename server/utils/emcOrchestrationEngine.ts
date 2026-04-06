import { randomUUID } from "crypto"
import mongoose from "mongoose"

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

export async function emcExecuteMovement(params: ExecuteParams) {

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
     LOAD DESTINATION CONFIG + CONTAINER
  ====================================================== */

  const destinationConfig = await db
    .collection("emcOrganizationContainerConfig")
    .findOne({ organizationId, type: containerType })

  if (!destinationConfig) throw new Error("Container config not found")

  const actionDef = destinationConfig.actions?.find(
    (a: any) => a.id === actionId
  )

  if (!actionDef?.orchestration) {
    throw new Error("Orchestration not configured")
  }

  const destination = await db
    .collection(destinationConfig.storage.collection)
    .findOne({
      organizationId,
      [destinationConfig.storage.primaryKey]: containerIDX
    })

  if (!destination) throw new Error("Destination container not found")

  const session = await mongoose.startSession()
  session.startTransaction()

  try {

    /* ======================================================
       RESOLVE SOURCE (IF REQUIRED)
    ====================================================== */

    let source: any = null
    let sourceConfig: any = null

    const orchestration = actionDef.orchestration

    if (orchestration.sourceStrategy === "PARENT") {

      if (!destination.parentContainerType ||
        !destination.parentContainerIDX) {
        throw new Error("Parent container not found")
      }

      sourceConfig = await db
        .collection("emcOrganizationContainerConfig")
        .findOne({
          organizationId,
          type: destination.parentContainerType
        })

      source = await db
        .collection(sourceConfig.storage.collection)
        .findOne({
          organizationId,
          [sourceConfig.storage.primaryKey]:
            destination.parentContainerIDX
        })

      if (!source) throw new Error("Parent container not found")
    }

    if (orchestration.sourceStrategy === "EXPLICIT") {

      if (!payload?.source?.containerType ||
        !payload?.source?.containerIDX) {
        throw new Error("Explicit source required")
      }

      sourceConfig = await db
        .collection("emcOrganizationContainerConfig")
        .findOne({
          organizationId,
          type: payload.source.containerType
        })

      source = await db
        .collection(sourceConfig.storage.collection)
        .findOne({
          organizationId,
          [sourceConfig.storage.primaryKey]:
            payload.source.containerIDX
        })

      if (!source) throw new Error("Explicit source not found")
    }

    /* ======================================================
       MOVEMENT SWITCH
    ====================================================== */

    switch (orchestration.movementType) {

      case "IN":
        await handleInMovement()
        break

      case "TRANSFER":
        await handleTransferMovement()
        break

      case "ASSIGN":
        await handleAssignMovement()
        break

      case "OUT":
        await handleOutMovement()
        break

      default:
        throw new Error("Unsupported movement type")
    }

    /* ======================================================
       WRITE ORCHESTRATION HISTORY
    ====================================================== */

    await db.collection("emcOrchestrationHistory").insertOne({
      organizationId,
      correlationId,
      actionId,
      containerType,
      containerIDX,
      payload,
      executedBy: userContext.userId,
      executedAt: new Date()
    }, { session })

    await session.commitTransaction()
    session.endSession()

    return { success: true, correlationId }

  } catch (error: any) {

    await session.abortTransaction()
    session.endSession()
    throw error
  }

  /* ======================================================
     HANDLERS
  ====================================================== */

  async function handleInMovement() {

    const quantities = payload?.quantities || {}

    for (const productIDX of Object.keys(quantities)) {

      const qty = Number(quantities[productIDX] || 0)
      if (qty <= 0) continue

      await db.collection("emcContainerInventory").updateOne(
        {
          organizationId,
          containerType: destinationConfig.type,
          containerIDX: containerIDX,
          productIDX
        },
        {
          $inc: { quantity: qty },
          $set: {
            updatedAt: new Date(),
            updatedBy: userContext.userId
          }
        },
        { upsert: true, session }
      )
    }
  }

  async function handleTransferMovement() {

    const items = payload?.items || []

    for (const item of items) {

      /* INVENTORY TRANSFER */

      if (item.quantity && item.quantity > 0) {

        const deduct = await db.collection("emcContainerInventory")
          .updateOne(
            {
              organizationId,
              containerType: sourceConfig.type,
              containerIDX:
                source[sourceConfig.storage.primaryKey],
              productIDX: item.IDX
            },
            { $inc: { quantity: -item.quantity } },
            { session }
          )

        if (deduct.modifiedCount === 0) {
          throw new Error(`Insufficient stock for ${item.IDX}`)
        }

        await db.collection("emcContainerInventory")
          .updateOne(
            {
              organizationId,
              containerType: destinationConfig.type,
              containerIDX: containerIDX,
              productIDX: item.IDX
            },
            { $inc: { quantity: item.quantity } },
            { upsert: true, session }
          )
      }

      /* STRUCTURAL TRANSFER */

      if (!item.quantity) {

        const childConfig = await db
          .collection("emcOrganizationContainerConfig")
          .findOne({
            organizationId,
            type: item.type
          })

        await db.collection(childConfig.storage.collection)
          .updateOne(
            {
              organizationId,
              [childConfig.storage.primaryKey]: item.IDX
            },
            {
              $set: {
                parentContainerType: destinationConfig.type,
                parentContainerIDX: containerIDX,
                updatedAt: new Date(),
                updatedBy: userContext.userId
              }
            },
            { session }
          )
      }
    }
  }

  async function handleAssignMovement() {

    const items = payload?.items || []

    for (const item of items) {

      const childConfig = await db
        .collection("emcOrganizationContainerConfig")
        .findOne({
          organizationId,
          type: item.type
        })

      await db.collection(childConfig.storage.collection)
        .updateOne(
          {
            organizationId,
            [childConfig.storage.primaryKey]: item.IDX
          },
          {
            $set: {
              parentContainerType: destinationConfig.type,
              parentContainerIDX: containerIDX,
              updatedAt: new Date(),
              updatedBy: userContext.userId
            }
          },
          { session }
        )
    }
  }

  async function handleOutMovement() {

    const items = payload?.items || []

    for (const item of items) {

      if (!item.quantity) continue

      const deduct = await db.collection("emcContainerInventory")
        .updateOne(
          {
            organizationId,
            containerType: sourceConfig.type,
            containerIDX:
              source[sourceConfig.storage.primaryKey],
            productIDX: item.IDX
          },
          { $inc: { quantity: -item.quantity } },
          { session }
        )

      if (deduct.modifiedCount === 0) {
        throw new Error(`Insufficient stock for ${item.IDX}`)
      }
    }
  }
}
