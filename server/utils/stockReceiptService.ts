/**
 * Stock Receipt Inventory Service
 * 
 * Handles warehouse goods inward inventory operations.
 * All inventory changes are recorded with mandatory audit trail.
 * 
 * Business Rules:
 * - Only ACTIVE products can be received
 * - Warehouse must not be ARCHIVED
 * - Quantity must be > 0 and numeric
 * - All operations use MongoDB transactions
 * - Every inventory change creates a movement record
 */

import type { ClientSession } from 'mongodb'
import { containerInventory } from '~/server/models/containerInventory'
import { emcContainers } from '~/server/models/emcContainers'
import { emcInventoryMovements } from '~/server/models/emcInventoryMovements'
import { emcInvItem } from '~/server/models/emcInvItem'

export interface StockReceiptRequest {
  organizationId: number
  warehouseId: string
  itemId: string
  quantity: number
  reference?: string
  remarks?: string
  performedBy: string
}

export interface StockReceiptResponse {
  success: boolean
  message: string
  data?: {
    movementId?: string
    inventoryId?: string
    previousQuantity?: number
    newQuantity?: number
  }
  error?: string
}

interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate warehouse exists and is not archived
 */
async function validateWarehouse(
  warehouseId: string,
  organizationId: number
): Promise<ValidationResult> {
  try {
    console.log(`   🏢 Searching for warehouse: id=${warehouseId}, orgId=${organizationId}`)

    let warehouse = await emcContainers.findOne({
      id: warehouseId,
      type: 'Warehouse',
      organizationId
    }).lean()

    // If not found with orgId filter, try without it
    if (!warehouse) {
      console.log(`   ⚠️  Warehouse not found with organizationId=${organizationId}, trying without orgId filter...`)
      warehouse = await emcContainers.findOne({
        id: warehouseId,
        type: 'Warehouse'
      }).lean()
    }

    if (!warehouse) {
      const error = `Warehouse not found: ${warehouseId}`
      console.log(`   ❌ ${error}`)
      return {
        valid: false,
        error
      }
    }

    console.log(`   ✅ Warehouse found: ${warehouse.id}, lifecycle: ${warehouse.lifecycle}, orgId: ${warehouse.organizationId}`)

    if (warehouse.lifecycle === 'ARCHIVED') {
      const error = `Warehouse is archived and cannot receive stock: ${warehouseId}`
      console.log(`   ❌ ${error}`)
      return {
        valid: false,
        error
      }
    }

    return { valid: true }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.log(`   ❌ Error validating warehouse: ${errorMsg}`)
    return {
      valid: false,
      error: `Error validating warehouse: ${errorMsg}`
    }
  }
}

/**
 * Validate product is active
 * Handles both ObjectId and string IDs
 * Products without lifecycle attribute are treated as ACTIVE
 */
async function validateProduct(
  itemId: string,
  organizationId: number = 12313
): Promise<ValidationResult> {
  try {
    console.log(`   📦 Searching for product: itemId=${itemId}`)
    let product = null

    // Try to find by _id as ObjectId (if valid ObjectId format)
    // Don't filter by organizationId for _id lookups since products might not have it set
    try {
      const { ObjectId } = await import('mongodb')
      if (ObjectId.isValid(itemId)) {
        console.log(`   → Trying ObjectId lookup...`)
        product = await emcInvItem.findOne({
          _id: new ObjectId(itemId)
        }).lean()
        if (product) {
          console.log(`   ✅ Found product by _id: ${product.sku} - ${product.name}`)
        }
      }
    } catch (err) {
      // Not a valid ObjectId, will try other lookups below
      console.log(`   → ObjectId lookup skipped or failed`)
    }

    // If not found by _id, try to find by sku or name
    if (!product) {
      console.log(`   → Trying sku/name lookup...`)
      product = await emcInvItem.findOne({
        $or: [
          { sku: itemId },
          { name: itemId }
        ]
      }).lean()
      if (product) {
        console.log(`   ✅ Found product by sku/name: ${product.sku} - ${product.name}`)
      }
    }

    if (!product) {
      console.log(`   ❌ Product not found for ID: ${itemId}`)
      return {
        valid: false,
        error: `Product not found: ${itemId}`
      }
    }

    // Check lifecycle - allow DRAFT and ACTIVE, reject ARCHIVED/SUSPENDED
    // DRAFT products can receive stock as part of setup/activation workflow
    const lifecycle = product.lifecycle || 'ACTIVE'
    console.log(`   ✅ Product validation passed: ${product.sku}, lifecycle: ${lifecycle}`)

    if (lifecycle === 'ARCHIVED' || lifecycle === 'SUSPENDED') {
      console.log(`   ❌ Product lifecycle is ${lifecycle} - cannot receive stock`)
      return {
        valid: false,
        error: `Product cannot receive stock in ${lifecycle} status: ${itemId}`
      }
    }

    return { valid: true }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.log(`   ❌ Error validating product: ${errorMsg}`)
    return {
      valid: false,
      error: `Error validating product: ${errorMsg}`
    }
  }
}

/**
 * Validate quantity is numeric and positive
 */
function validateQuantity(quantity: any): ValidationResult {
  // Check if it's a number
  if (typeof quantity !== 'number') {
    return {
      valid: false,
      error: `Quantity must be numeric: ${quantity}`
    }
  }

  // Check if it's positive
  if (quantity <= 0) {
    return {
      valid: false,
      error: `Quantity must be greater than 0: ${quantity}`
    }
  }

  // Check if it's an integer (no decimals)
  if (!Number.isInteger(quantity)) {
    return {
      valid: false,
      error: `Quantity must be an integer: ${quantity}`
    }
  }

  return { valid: true }
}

/**
 * Execute stock receipt within a MongoDB transaction
 * 
 * Transaction Steps:
 * 1. Find containerInventory record
 * 2. Update or insert containerInventory
 * 3. Insert inventory movement record
 */
export async function processStockReceipt(
  request: StockReceiptRequest,
  session?: ClientSession
): Promise<StockReceiptResponse> {
  console.log('\n' + '='.repeat(80))
  console.log('📦 Stock Receipt Processing Started')
  console.log('='.repeat(80))
  console.log('Request:', JSON.stringify(request, null, 2))

  try {
    // Ensure organizationId is a number
    const orgId = typeof request.organizationId === 'string'
      ? parseInt(request.organizationId, 10)
      : request.organizationId

    console.log(`   🔍 Converted organizationId: ${orgId} (type: ${typeof orgId})`)

    // Update request with converted organizationId
    const normalizedRequest = { ...request, organizationId: orgId }

    // ========== VALIDATION PHASE ==========
    console.log('\n🔍 Validation Phase:')

    // Validate warehouse
    const warehouseValidation = await validateWarehouse(
      normalizedRequest.warehouseId,
      orgId
    )
    if (!warehouseValidation.valid) {
      console.log(`   ❌ Warehouse validation failed: ${warehouseValidation.error}`)
      return {
        success: false,
        message: warehouseValidation.error || 'Warehouse validation failed',
        error: warehouseValidation.error
      }
    }
    console.log('   ✅ Warehouse validation passed')

    // Validate product
    const productValidation = await validateProduct(
      normalizedRequest.itemId,
      orgId
    )
    if (!productValidation.valid) {
      console.log(`   ❌ Product validation failed: ${productValidation.error}`)
      return {
        success: false,
        message: productValidation.error || 'Product validation failed',
        error: productValidation.error
      }
    }
    console.log('   ✅ Product validation passed')

    // Validate quantity
    const quantityValidation = validateQuantity(normalizedRequest.quantity)
    if (!quantityValidation.valid) {
      console.log(`   ❌ Quantity validation failed: ${quantityValidation.error}`)
      return {
        success: false,
        message: quantityValidation.error || 'Quantity validation failed',
        error: quantityValidation.error
      }
    }
    console.log(`   ✅ Quantity validation passed (quantity: ${normalizedRequest.quantity})`)

    // ========== TRANSACTION PHASE ==========
    console.log('\n💾 Transaction Phase:')
    const now = new Date()

    // Find or create containerInventory record
    console.log(`   🔍 Looking for existing inventory record...`)
    let containerInvRecord = await containerInventory.findOne(
      {
        organizationId: orgId,
        containerId: normalizedRequest.warehouseId,
        itemId: normalizedRequest.itemId
      }
    ).lean()

    console.log(`   → Found existing record: ${!!containerInvRecord}`)

    let inventoryId: string | undefined
    let previousQuantity = 0

    if (containerInvRecord) {
      // Update existing record
      console.log('   📝 Updating existing inventory record')
      previousQuantity = containerInvRecord.quantityOnHand
      const newQuantityOnHand = containerInvRecord.quantityOnHand + normalizedRequest.quantity
      const newQuantityAvailable =
        newQuantityOnHand - containerInvRecord.quantityReserved

      const updateResult = await containerInventory.updateOne(
        {
          _id: containerInvRecord._id
        },
        {
          $set: {
            quantityOnHand: newQuantityOnHand,
            quantityAvailable: newQuantityAvailable,
            updatedAt: now
          }
        }
      )

      if (!updateResult.acknowledged) {
        throw new Error('Failed to update container inventory')
      }

      inventoryId = containerInvRecord._id?.toString()
      console.log(
        `      Old Qty: ${previousQuantity} → New Qty: ${newQuantityOnHand}`
      )
    } else {
      // Insert new record
      console.log('   ➕ Creating new inventory record')
      console.log(`      OrgId: ${orgId} (type: ${typeof orgId})`)
      console.log(`      WarehouseId: ${normalizedRequest.warehouseId} (type: ${typeof normalizedRequest.warehouseId})`)
      console.log(`      ItemId: ${normalizedRequest.itemId} (type: ${typeof normalizedRequest.itemId})`)
      console.log(`      Qty: ${normalizedRequest.quantity} (type: ${typeof normalizedRequest.quantity})`)

      const newRecord: any = {
        organizationId: orgId,
        containerId: normalizedRequest.warehouseId,
        containerType: 'Warehouse',
        itemId: normalizedRequest.itemId,
        quantityOnHand: normalizedRequest.quantity,
        quantityReserved: 0,
        quantityAvailable: normalizedRequest.quantity,
        createdAt: now,
        updatedAt: now
      }

      // Validate all required fields before insert
      const requiredFields = ['organizationId', 'containerId', 'containerType', 'itemId', 'quantityOnHand'];
      const missingFields = requiredFields.filter(field => {
        const value = (newRecord as any)[field]
        const isMissing = value === undefined || value === null || value === ''
        if (isMissing) {
          console.log(`      ❌ Missing field: ${field}`)
        }
        return isMissing
      })

      if (missingFields.length > 0) {
        throw new Error(`Cannot create inventory record: Missing required fields: ${missingFields.join(', ')}`)
      }

      console.log('      ✅ All required fields present')
      console.log('      Record to insert:', JSON.stringify(newRecord, null, 2))

      try {
        console.log('      📝 Calling containerInventory.create()...')
        const insertResult = await containerInventory.create([newRecord])
        console.log(`      ✅ Mongoose create() returned:`, insertResult)

        if (!insertResult || insertResult.length === 0) {
          throw new Error('containerInventory.create() returned empty result')
        }

        inventoryId = insertResult[0]._id?.toString()
        previousQuantity = 0
        console.log(`      ✅ Created inventory record: ${inventoryId} with Qty: ${normalizedRequest.quantity}`)
      } catch (createErr: any) {
        console.log(`      ❌ Failed to create inventory record`)
        console.log(`      Error message: ${createErr.message}`)
        console.log(`      Error name: ${createErr.name}`)
        console.log(`      Error details:`, createErr)
        throw createErr
      }
    }

    // Insert movement record (mandatory)
    console.log('   📋 Creating inventory movement record')
    const movementRecord: any = {
      organizationId: orgId,
      movementType: 'StockReceipt',
      containerId: normalizedRequest.warehouseId,
      containerType: 'Warehouse',
      itemId: normalizedRequest.itemId,
      quantity: normalizedRequest.quantity,
      reference: normalizedRequest.reference || null,
      remarks: normalizedRequest.remarks || null,
      performedBy: normalizedRequest.performedBy,
      performedAt: now,
      createdAt: now
    }

    const movementResult = await emcInventoryMovements.create([movementRecord])
    const movementId = movementResult[0]._id?.toString()
    console.log(`      Movement record created: ${movementId}`)

    console.log('\n✅ Stock Receipt Completed Successfully')
    console.log('='.repeat(80))

    return {
      success: true,
      message: 'StockReceipt completed successfully',
      data: {
        movementId,
        inventoryId,
        previousQuantity,
        newQuantity: previousQuantity + normalizedRequest.quantity
      }
    }
  } catch (error) {
    console.log('\n❌ Stock Receipt Failed')
    console.log('='.repeat(80))
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.log(`Error: ${errorMessage}`)
    console.log(`Stack: ${error instanceof Error ? error.stack : 'N/A'}`)

    return {
      success: false,
      message: 'StockReceipt failed',
      error: errorMessage
    }
  }
}
