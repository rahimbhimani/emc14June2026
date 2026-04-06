import { ContainerAssociation } from '../models/ContainerAssociation'
import { containerInventory } from '../models/containerInventory'
import { ContainerMovement } from '../models/ContainerMovement'
import { emcContainers } from '../models/emcContainers'
import { emcInvItem } from '../models/emcInvItem'
import { emcOrganizationContainerConfig } from '../models/emcOrganizationContainerConfig'
import type { IContainerAction, IContainerConfig } from '../models/OrganizationContainerConfig'
import type { StockReceiptRequest } from './stockReceiptService'
import { processStockReceipt } from './stockReceiptService'

interface UserContext {
  id: string
  name: string
  code: string
}

export type ContainerStatus = 'DRAFT' | 'READY' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
export type ContainerAction = 'Activate' | 'Attach' | 'Detach' | 'Close' | 'Reopen' | 'Archive'

export interface StatusTransitionResult {
  success: boolean
  message: string
  updatedContainers?: Array<{
    id: string
    previousStatus: string
    newStatus: string
  }>
  movementRecord?: any
  stockReceipt?: {
    movementId?: string
    inventoryId?: string
    previousQuantity?: number
    newQuantity?: number
    totalQuantityInWarehouse?: number
  }
}

export interface ValidActionInfo {
  action: string
  currentStatus: ContainerStatus
  newStatus?: ContainerStatus
  description?: string
  precondition?: {
    lifecycle?: string[]
  }
}

/**
 * Fetch container config from database
 */
async function getContainerConfig(
  containerType: string,
  organizationId: number
): Promise<IContainerConfig | null> {
  try {
    const orgConfigs = await emcOrganizationContainerConfig.findOne({
      organizationId,
    })

    if (!orgConfigs) {
      console.warn(`No organization config found for org ${organizationId}`)
      return null
    }

    const config = orgConfigs.configs?.find((c: IContainerConfig) => c.type === containerType)
    return config || null
  } catch (err) {
    console.error(`Error fetching container config for type ${containerType}:`, err)
    return null
  }
}

/**
 * Get action configuration from container type
 */
async function getActionConfig(
  containerType: string,
  actionId: string,
  organizationId: number
): Promise<IContainerAction | null> {
  const config = await getContainerConfig(containerType, organizationId)
  if (!config) return null

  return config.actions?.find((a) => a.id === actionId) || null
}

/**
 * Get all valid actions available for a given status (from database config)
 */
export async function getValidActionsForStatus(
  currentStatus: ContainerStatus,
  containerType: string,
  organizationId: number
): Promise<ValidActionInfo[]> {
  const config = await getContainerConfig(containerType, organizationId)
  console.log(`Fetched config for type "${containerType}":`, config, "current status:", currentStatus)
  if (!config || !config.actions) return []

  const validActions: ValidActionInfo[] = []

  for (const action of config.actions) {
    // Check if action is valid for current status
    const allowedStatuses = action.precondition?.lifecycle || []
    console.log("allowedStatuses", allowedStatuses)
    if (allowedStatuses.length === 0 || allowedStatuses.includes(currentStatus)) {
      validActions.push({
        action: action.id,
        currentStatus,
        description: action.label,
        precondition: action.precondition,
      })
    }
  }
  console.log("validActions", validActions)
  return validActions
}

/**
 * Check if a status transition is valid (from database config)
 */
export async function isValidTransition(
  currentStatus: ContainerStatus,
  action: string,
  containerType: string,
  organizationId: number
): Promise<boolean> {
  const validActions = await getValidActionsForStatus(currentStatus, containerType, organizationId)
  return validActions.some((a) => a.action === action)
}

/**
 * Get new status after action (if valid) - THIS SHOULD BE DEFINED IN DB FOR EACH ACTION
 */
export async function getNewStatus(
  currentStatus: ContainerStatus,
  action: string,
  containerType: string,
  organizationId: number
): Promise<ContainerStatus | null> {
  // Default transitions - these should ideally be in the database too
  // For now, using sensible defaults based on the action
  const defaultTransitions: Record<string, Record<ContainerStatus, ContainerStatus>> = {
    Activate: {
      DRAFT: 'READY',
      READY: 'READY',
      ACTIVE: 'ACTIVE',
      CLOSED: 'CLOSED',
      ARCHIVED: 'ARCHIVED',
    },
    Attach: {
      DRAFT: 'DRAFT',
      READY: 'ACTIVE',
      ACTIVE: 'ACTIVE',
      CLOSED: 'CLOSED',
      ARCHIVED: 'ARCHIVED',
    },
    Detach: {
      DRAFT: 'DRAFT',
      READY: 'READY',
      ACTIVE: 'ACTIVE',
      CLOSED: 'CLOSED',
      ARCHIVED: 'ARCHIVED',
    },
    Close: {
      DRAFT: 'DRAFT',
      READY: 'READY',
      ACTIVE: 'CLOSED',
      CLOSED: 'CLOSED',
      ARCHIVED: 'ARCHIVED',
    },
    Reopen: {
      DRAFT: 'DRAFT',
      READY: 'READY',
      ACTIVE: 'ACTIVE',
      CLOSED: 'READY',
      ARCHIVED: 'ARCHIVED',
    },
    Archive: {
      DRAFT: 'ARCHIVED',
      READY: 'ARCHIVED',
      ACTIVE: 'ARCHIVED',
      CLOSED: 'ARCHIVED',
      ARCHIVED: 'ARCHIVED',
    },
  }

  return (defaultTransitions[action]?.[currentStatus] as ContainerStatus) || null
}

/**
 * Preflight checks - validate action before execution (DATABASE-DRIVEN)
 */
export async function preflightCheckAction(
  container: any,
  action: ContainerAction,
  parentContainerId?: string,
  childContainerId?: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []
  const currentStatus = container.lifecycle as ContainerStatus
  const containerType = container.type
  const organizationId = container.organizationId || 'default'

  // Special handling: Skip preflight for products during stock receipt (ATTACH action)
  // Products don't have container configurations, only the parent (warehouse) matters
  const isProductAttachment = container.type === 'Item' && action === 'Attach' && parentContainerId
  if (isProductAttachment) {
    console.log(`ℹ️  Skipping preflight for product attachment (stock receipt)`)
    return { valid: true, errors: [] }
  }

  // 1. Check if action is allowed for current status (from database config)
  const isValid = await isValidTransition(currentStatus, action, containerType, organizationId)
  if (!isValid) {
    const validActions = await getValidActionsForStatus(currentStatus, containerType, organizationId)
    errors.push(
      `Action "${action}" not valid for status "${currentStatus}". Valid actions: ${validActions.map(v => v.action).join(', ')}`
    )
  }

  // 2. Check action-specific requirements from database config
  const actionConfig = await getActionConfig(containerType, action, organizationId)
  if (!actionConfig) {
    errors.push(`Action "${action}" not found in configuration for type "${containerType}"`)
    return { valid: false, errors }
  }

  // Actions like Attach and Detach require child containers
  if ((action === 'Attach' || action === 'Detach') && (!parentContainerId || !childContainerId)) {
    errors.push(`Action "${action}" requires both parentContainerId and childContainerId`)
  }

  // 3. Validate parent/child existence and preconditions
  if (parentContainerId || childContainerId) {
    if (parentContainerId) {
      const parent = await emcContainers.findOne({ id: parentContainerId })
      if (!parent) {
        errors.push(`Parent container "${parentContainerId}" not found`)
      } else {
        const parentStatus = parent.lifecycle as ContainerStatus
        const parentType = parent.type

        // Check parent's action preconditions from database
        if (action === 'Attach') {
          const parentActionConfig = await getActionConfig(parentType, action, organizationId)
          if (parentActionConfig?.precondition?.lifecycle) {
            const allowedStatuses = parentActionConfig.precondition.lifecycle
            if (!allowedStatuses.includes(parentStatus)) {
              errors.push(
                `Action "${action}" not valid for ${parentType} status "${parentStatus}". Valid statuses: ${allowedStatuses.join(', ')}`
              )
            }
          }
        }
      }
    }

    if (childContainerId) {
      const child = await emcContainers.findOne({ id: childContainerId })
      if (!child) {
        errors.push(`Child container "${childContainerId}" not found`)
      }
    }
  }

  // 4. Check cascade effects for Close and Archive actions
  if (action === 'Close' || action === 'Archive') {
    const childAssociations = await ContainerAssociation.find({
      parentContainerId: container.id,
      status: 'active',
    }).lean()
    const childIds = Array.from(new Set(childAssociations.flatMap((assoc: any) => assoc.childContainerIds || [])))

    if (childIds.length > 0) {
      const children = await emcContainers.find({ id: { $in: childIds } }).lean()
      const childStatuses = children.map((c: any) => c.lifecycle)
      const affectedCount = children.length

      console.log(
        `⚠️  Action "${action}" will cascade to ${affectedCount} children with statuses: ${[...new Set(childStatuses)].join(', ')}`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Unified container status manager
 * Handles all lifecycle transitions with related status rules and writes movement audit logs.
 */
export async function updateContainerStatus(
  containerId: string,
  action: ContainerAction,
  userContext: UserContext,
  parentContainerId?: string,
  childContainerId?: string,
  quantity?: number,
  organizationId?: number | string
): Promise<StatusTransitionResult> {
  try {
    console.log(`\n🔧 [updateContainerStatus] Action: "${action}" on Container: "${containerId}"`)
    console.log(`   Parent: ${parentContainerId}, Child: ${childContainerId}, Quantity: ${quantity}, OrgId: ${organizationId}`)

    // Load container
    let container = await emcContainers.findOne({ id: containerId })

    // If container not found and this is an ATTACH action, try to find as a product (for stock receipt)
    if (!container && action === 'Attach' && parentContainerId) {
      console.log(`⚠️  Container not found in emcContainers, checking if it's a product...`)

      try {
        const product = await emcInvItem.findOne({ _id: containerId }).lean()
        if (product) {
          console.log(`   ✅ Found product: ${product.sku} - ${product.name}`)
          // Create a virtual container object for the product
          container = {
            id: containerId,
            type: 'Item',
            label: product.name,
            sku: product.sku,
            lifecycle: product.lifecycle || 'ACTIVE'
          } as any
        }
      } catch (err) {
        console.log(`   ❌ Error checking for product:`, err)
      }
    }

    if (!container) {
      console.log(`❌ Container/Product not found: ${containerId}`)
      return { success: false, message: `Container ${containerId} not found` }
    }

    console.log(`✅ Container found: ${container.id}, Current status: ${container.lifecycle}`)

    // PREFLIGHT CHECK: Validate action before execution
    const preflight = await preflightCheckAction(container, action, parentContainerId, childContainerId)
    if (!preflight.valid) {
      console.log(`❌ Preflight validation failed:`)
      preflight.errors.forEach(err => console.log(`   - ${err}`))
      return { success: false, message: `Validation failed: ${preflight.errors.join('; ')}` }
    }

    console.log(`✅ Preflight checks passed`)

    // Route to appropriate handler based on action
    let result: StatusTransitionResult
    switch (action.toUpperCase()) {
      case 'ACTIVATE':
        console.log('→ Routing to handleActivateAction')
        result = await handleActivateAction(container, userContext)
        break
      case 'ATTACH':
        console.log('→ Routing to handleAttachAction')
        result = await handleAttachAction(container, parentContainerId!, childContainerId!, userContext, quantity, organizationId)
        break
      case 'DETACH':
        console.log('→ Routing to handleDetachAction')
        result = await handleDetachAction(container, parentContainerId!, childContainerId!, userContext)
        break
      case 'CLOSE':
        console.log('→ Routing to handleCloseAction')
        result = await handleCloseAction(container, userContext)
        break
      case 'REOPEN':
        console.log('→ Routing to handleReopenAction')
        result = await handleReopenAction(container, userContext)
        break
      case 'ARCHIVE':
        console.log('→ Routing to handleArchiveAction')
        result = await handleArchiveAction(container, userContext)
        break
      default:
        console.log(`❌ Unknown action: ${action}`)
        return { success: false, message: `Unknown action: ${action}` }
    }

    console.log(`✅ Action handler returned:`, result?.message || 'No message')
    return result
  }
  catch (error) {
    console.error(`❌ Error in updateContainerStatus for ${containerId}:`, error)
    if (error instanceof Error) {
      return { success: false, message: `Status update failed: ${error.message}` }
    }
    return { success: false, message: `Status update failed: ${String(error)}` }
  }
}

const buildMovementRecord = async (
  movementType: 'Activate' | 'Attach' | 'Detach' | 'Close' | 'Reopen' | 'Archive',
  parent: any,
  userContext: UserContext,
  fromStatus: string,
  toStatus: string,
  child?: any
) => {
  console.log('\n   📝 [buildMovementRecord] Creating movement record...')
  console.log('      Type:', movementType)
  console.log('      Parent:', parent.id, `(${parent.type})`)
  console.log('      Child:', child?.id, `(${child?.type})`)
  console.log('      Status:', fromStatus, '→', toStatus)

  const movementData = {
    organizationId: parent.organizationId,
    movementType,
    parentContainerId: parent.id,
    parentContainerType: parent.type,
    childContainerId: child?.id,
    childContainerType: child?.type,
    fromStatus,
    toStatus,
    parentStatusBefore: fromStatus,
    parentStatusAfter: toStatus,
    movedBy: userContext.id,
    movedByName: userContext.name,
    movedByCode: userContext.code,
    movedAt: new Date(),
  }

  console.log('      Data to save:', movementData)

  try {
    const movementRecord = new ContainerMovement(movementData)
    console.log('      ✅ Movement record created in memory')

    await movementRecord.save()
    console.log('      ✅ Movement record saved to DB:', movementRecord._id)

    return movementRecord
  } catch (error) {
    console.error('      ❌ Error saving movement record:', error)
    throw error
  }
}

/**
 * Activate: DRAFT -> READY
 */
async function handleActivateAction(
  container: any,
  userContext: UserContext
): Promise<StatusTransitionResult> {
  const previousStatus = container.lifecycle
  const organizationId = container.organizationId || 'default'
  const newStatus = (await getNewStatus(previousStatus as ContainerStatus, 'Activate', container.type, organizationId)) as ContainerStatus

  container.lifecycle = newStatus
  await container.save()

  const movementRecord = await buildMovementRecord('Activate', container, userContext, previousStatus, newStatus)

  return {
    success: true,
    message: `${container.label} activated and ready for use.`,
    updatedContainers: [{ id: container.id, previousStatus, newStatus }],
    movementRecord,
  }
}

/**
 * Attach: Parent READY -> ACTIVE, child lifecycle unchanged, relationship created outside.
 * Special handling: If parent is Warehouse and child is Item, performs automatic stock receipt.
 */
async function handleAttachAction(
  container: any,
  parentContainerId: string,
  childContainerId: string,
  userContext: UserContext,
  quantity?: number,
  passedOrgId?: number | string
): Promise<StatusTransitionResult> {
  console.log('\n📌 [handleAttachAction] START')
  console.log('   Container ID:', container?.id)
  console.log('   Parent ID:', parentContainerId)
  console.log('   Child ID:', childContainerId)
  console.log('   Quantity:', quantity)
  console.log('   Passed OrgId:', passedOrgId)

  const parent = await emcContainers.findOne({ id: parentContainerId })
  let child = await emcContainers.findOne({ id: childContainerId })

  console.log('✅ Parent found:', !!parent, parent?.id, parent?.lifecycle, 'Type:', parent?.type)
  console.log('✅ Child found (from containers):', !!child, child?.id, child?.lifecycle, 'Type:', child?.type)

  // Validate parent exists
  if (!parent) {
    console.log('❌ Parent container not found:', parentContainerId)
    return {
      success: false,
      message: `Parent container not found: ${parentContainerId}`
    }
  }

  // ========== HANDLE PRODUCT ATTACHMENT ==========
  // If child container not found, check if it's a product reference (common for stock receipt workflow)
  let isProductAttachment = false
  if (!child) {
    console.log('\n📦 Child container not found in emcContainers')
    console.log('   Checking if childContainerId refers to a product...')

    try {
      const product = await emcInvItem.findOne({ _id: childContainerId }).lean()

      if (product) {
        console.log('   ✅ Product found:', product?.sku, product?.name)
        console.log('   📦 Treating as Item type attachment (stock receipt)')
        // Create a virtual container object for the product
        child = {
          id: childContainerId,
          type: 'Item',
          label: product.name,
          sku: product.sku,
          lifecycle: product.lifecycle || 'ACTIVE'
        } as any
        isProductAttachment = true
      } else {
        console.log('   ❌ Product not found with ID:', childContainerId)
        return {
          success: false,
          message: `Child container/product not found: ${childContainerId}`
        }
      }
    } catch (err: any) {
      console.log('   ❌ Error checking for product:', err.message)
      return {
        success: false,
        message: `Failed to validate child attachment: ${err.message}`
      }
    }
  }

  const parentPreviousStatus = parent.lifecycle
  let organizationId: number | string = passedOrgId || parent.organizationId || 'default'

  // Ensure organizationId is a number if it's a valid number
  let finalOrgId = organizationId
  if (typeof organizationId === 'string' && !isNaN(parseInt(organizationId, 10))) {
    finalOrgId = parseInt(organizationId, 10)
  }

  console.log(`   ✅ Using organizationId: ${finalOrgId} (type: ${typeof finalOrgId})`)
  const parentNewStatus = (await getNewStatus(parentPreviousStatus as ContainerStatus, 'Attach', parent.type, finalOrgId as number)) as ContainerStatus
  console.log('   Parent status change:', parentPreviousStatus, '→', parentNewStatus)

  if (parentNewStatus !== parentPreviousStatus) {
    parent.lifecycle = parentNewStatus
    await parent.save()
    console.log('✅ Parent status updated in database')
  } else {
    console.log('ℹ️  Parent status unchanged (already in appropriate state)')
  }

  const movementRecord = await buildMovementRecord('Attach', parent, userContext, parentPreviousStatus, parentNewStatus, child)
  console.log('✅ Movement record created:', movementRecord._id)

  // ========== STOCK RECEIPT INTEGRATION ==========
  let stockReceiptData: any = null

  if (parent.type === 'Warehouse' && child.type === 'Item' && quantity && quantity > 0) {
    console.log('\n📦 [Stock Receipt] Warehouse + Item detected!')
    console.log(`   Parent: ${parent.label} (${parent.id}) [Type: ${parent.type}]`)
    console.log(`   Child: ${child.label} (${child.id}) [Type: ${child.type}]`)
    console.log(`   Quantity: ${quantity}`)
    if (isProductAttachment) {
      console.log(`   ℹ️  This is a product attachment (stock receipt from item receipt flow)`)
    }
    console.log('   Processing stock receipt...')

    if (!Number.isInteger(quantity)) {
      console.log('❌ Quantity must be integer:', quantity)
      return {
        success: false,
        message: 'Stock receipt failed: Quantity must be a whole number'
      }
    }

    // Generate reference number from warehouse and item
    const reference = `ATTACH-${parent.id}-${child.id}-${Date.now()}`

    try {
      const stockReceiptRequest: StockReceiptRequest = {
        organizationId: finalOrgId as number,
        warehouseId: parent.id,
        itemId: child.id,
        quantity,
        reference,
        remarks: `Automatic stock receipt on item attachment`,
        performedBy: userContext.name || userContext.id
      }

      console.log('\n   📥 Stock Receipt Request:')
      console.log(`      organizationId: ${stockReceiptRequest.organizationId} (type: ${typeof stockReceiptRequest.organizationId})`)
      console.log(`      warehouseId: ${stockReceiptRequest.warehouseId}`)
      console.log(`      itemId: ${stockReceiptRequest.itemId}`)
      console.log(`      quantity: ${stockReceiptRequest.quantity}`)

      console.log('   🔄 Calling processStockReceipt...')
      const receiptResult = await processStockReceipt(stockReceiptRequest)
      console.log('   📥 Stock Receipt Result received:', receiptResult)

      if (!receiptResult.success) {
        console.log(`❌ Stock receipt failed: ${receiptResult.error}`)
        console.log(`   Full error response:`, receiptResult)
        return {
          success: false,
          message: `Stock receipt failed: ${receiptResult.error}`
        }
      }

      console.log('✅ Stock receipt completed successfully')
      console.log(`   MovementId: ${receiptResult.data?.movementId}`)
      console.log(`   InventoryId: ${receiptResult.data?.inventoryId}`)
      stockReceiptData = receiptResult.data

      // Get total quantity in warehouse for this item
      const inventoryRecord = await containerInventory.findOne({
        organizationId: finalOrgId as number,
        containerId: parent.id,
        itemId: child.id
      }).lean()

      if (inventoryRecord) {
        stockReceiptData.totalQuantityInWarehouse = inventoryRecord.quantityOnHand
        console.log(`   📊 Total quantity in warehouse: ${inventoryRecord.quantityOnHand}`)
      }

    } catch (err: any) {
      console.log('❌ Error processing stock receipt:', err.message)
      return {
        success: false,
        message: `Attachment succeeded but stock receipt failed: ${err.message}`
      }
    }
  }

  console.log('✅ [handleAttachAction] SUCCESS')
  return {
    success: true,
    message: `Successfully attached ${child.label} to ${parent.label}`,
    updatedContainers: [{ id: parent.id, previousStatus: parentPreviousStatus, newStatus: parentNewStatus }],
    movementRecord,
    stockReceipt: stockReceiptData
  }
}

/**
 * Detach: Parent ACTIVE -> READY if last child after unlink, child lifecycle unchanged.
 */
async function handleDetachAction(
  container: any,
  parentContainerId: string,
  childContainerId: string,
  userContext: UserContext
): Promise<StatusTransitionResult> {
  const parent = await emcContainers.findOne({ id: parentContainerId })
  const child = await emcContainers.findOne({ id: childContainerId })

  const parentPreviousStatus = parent.lifecycle

  const associationDocs = await ContainerAssociation.find({
    parentContainerId,
    status: 'active',
  }).lean()

  const remainingChildren = associationDocs.reduce((count, doc) => {
    const afterDetach = (doc.childContainerIds || []).filter((id: string) => id !== childContainerId)
    return count + afterDetach.length
  }, 0)

  // Determine new parent status based on remaining children
  const parentNewStatus = remainingChildren === 0 ? 'READY' : 'ACTIVE'

  if (parentNewStatus !== parentPreviousStatus) {
    parent.lifecycle = parentNewStatus
    await parent.save()
  }

  const movementRecord = await buildMovementRecord('Detach', parent, userContext, parentPreviousStatus, parentNewStatus, child)

  const message = remainingChildren === 0
    ? `Successfully detached ${child.label} from ${parent.label}. Parent moved to READY.`
    : `Successfully detached ${child.label} from ${parent.label}. Parent remains ACTIVE.`

  return {
    success: true,
    message,
    updatedContainers: [{ id: parent.id, previousStatus: parentPreviousStatus, newStatus: parentNewStatus }],
    movementRecord,
  }
}

/**
 * Close: Parent ACTIVE -> CLOSED and ACTIVE children -> CLOSED.
 */
async function handleCloseAction(
  container: any,
  userContext: UserContext
): Promise<StatusTransitionResult> {
  const containerPreviousStatus = container.lifecycle
  const organizationId = container.organizationId || 'default'
  const containerNewStatus = (await getNewStatus(containerPreviousStatus as ContainerStatus, 'Close', container.type, organizationId)) || containerPreviousStatus

  container.lifecycle = containerNewStatus
  await container.save()

  const updatedContainers = [
    { id: container.id, previousStatus: containerPreviousStatus, newStatus: containerNewStatus },
  ]

  // Find all linked children and cascade ACTIVE -> CLOSED
  const childAssociations = await ContainerAssociation.find({
    parentContainerId: container.id,
    status: 'active',
  })
  const childIds = Array.from(new Set(childAssociations.flatMap((assoc: any) => assoc.childContainerIds || [])))

  if (childIds.length > 0) {
    const children = await emcContainers.find({ id: { $in: childIds } })

    for (const child of children) {
      const childPreviousStatus = child.lifecycle
      if (childPreviousStatus === 'ACTIVE') {
        child.lifecycle = 'CLOSED'
        await child.save()

        updatedContainers.push({
          id: child.id,
          previousStatus: childPreviousStatus,
          newStatus: 'CLOSED',
        })
      }
    }
  }

  const movementRecord = await buildMovementRecord('Close', container, userContext, containerPreviousStatus, containerNewStatus)

  const message = childIds.length > 0
    ? `${container.label} closed. ${updatedContainers.length - 1} active child container(s) also closed.`
    : `${container.label} closed.`

  return {
    success: true,
    message,
    updatedContainers,
    movementRecord,
  }
}

/**
 * Reopen: CLOSED -> READY
 */
async function handleReopenAction(
  container: any,
  userContext: UserContext
): Promise<StatusTransitionResult> {
  const previousStatus = container.lifecycle
  const organizationId = container.organizationId || 'default'
  const newStatus = (await getNewStatus(previousStatus as ContainerStatus, 'Reopen', container.type, organizationId)) || previousStatus

  container.lifecycle = newStatus
  await container.save()

  const movementRecord = await buildMovementRecord('Reopen', container, userContext, previousStatus, newStatus)

  return {
    success: true,
    message: `${container.label} reopened and moved to READY.`,
    updatedContainers: [{ id: container.id, previousStatus, newStatus }],
    movementRecord,
  }
}

/**
 * Archive: Any -> ARCHIVED recursively for descendants.
 */
async function handleArchiveAction(
  container: any,
  userContext: UserContext
): Promise<StatusTransitionResult> {
  const containerPreviousStatus = container.lifecycle
  const organizationId = container.organizationId || 'default'
  const containerNewStatus = (await getNewStatus(containerPreviousStatus as ContainerStatus, 'Archive', container.type, organizationId)) || containerPreviousStatus

  container.lifecycle = containerNewStatus
  await container.save()

  const updatedContainers = [
    { id: container.id, previousStatus: containerPreviousStatus, newStatus: containerNewStatus },
  ]

  // Recursively archive all descendants
  const archiveDescendants = async (parentId: string): Promise<void> => {
    const childAssociations = await ContainerAssociation.find({
      parentContainerId: parentId,
      status: 'active',
    })
    const childIds = Array.from(new Set(childAssociations.flatMap((assoc: any) => assoc.childContainerIds || [])))

    if (childIds.length > 0) {
      const children = await emcContainers.find({ id: { $in: childIds } })

      for (const child of children) {
        const childPreviousStatus = child.lifecycle
        child.lifecycle = containerNewStatus
        await child.save()

        updatedContainers.push({
          id: child.id,
          previousStatus: childPreviousStatus,
          newStatus: containerNewStatus,
        })

        // Recursively archive this child's children
        await archiveDescendants(child.id)
      }
    }
  }

  await archiveDescendants(container.id)

  const movementRecord = await buildMovementRecord('Archive', container, userContext, containerPreviousStatus, containerNewStatus)

  return {
    success: true,
    message: `${container.label} and all descendants archived.`,
    updatedContainers,
    movementRecord,
  }
}
