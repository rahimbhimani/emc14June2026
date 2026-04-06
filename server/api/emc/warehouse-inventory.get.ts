import { containerInventory } from '~/server/models/containerInventory'
import { emcInvItem } from '~/server/models/emcInvItem'
import type { UserContext } from '~/types/emcContainer'

interface WarehouseInventoryResponse {
  success: boolean
  data?: any
  error?: string
}

/**
 * Get warehouse inventory for items
 * 
 * Query params:
 * - itemId: (optional) Get inventory for specific item
 * - warehouseId: (optional) Get inventory for specific warehouse
 * 
 * Returns array of inventory records with:
 * - itemId
 * - warehouseId
 * - quantityOnHand
 * - quantityReserved
 * - quantityAvailable = onHand - reserved
 */
export default defineEventHandler(async (event): Promise<WarehouseInventoryResponse> => {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('🔵 [API] Get Warehouse Inventory Called')
    console.log('='.repeat(80))

    // Get user context from session/auth (mock for now)
    const userContext: UserContext = {
      id: 'user-123',
      organizationId: 12313,
      roles: [
        { id: 9090, name: 'Admin' },
        { id: 9091, name: 'Manager' }
      ]
    }

    console.log('👤 User Context:', JSON.stringify(userContext, null, 2))

    // Get query parameters
    const query = getQuery(event)
    const itemId = query.itemId as string | undefined
    const warehouseId = query.warehouseId as string | undefined

    console.log('📦 Query params:', { itemId, warehouseId })

    // Build query object for containerInventory
    let queryObj: any = {
      organizationId: userContext.organizationId
    }

    if (itemId) {
      queryObj.itemId = itemId
      console.log('🔍 Looking up inventory for item:', itemId)
    }

    if (warehouseId) {
      queryObj.containerId = warehouseId
      console.log('🔍 Looking up inventory for warehouse:', warehouseId)
    }

    console.log('📦 Database query:', JSON.stringify(queryObj))

    // Get inventory records from containerInventory
    const inventoryRecords = await containerInventory.find(queryObj).lean()
    console.log(`✅ Found ${inventoryRecords?.length || 0} inventory record(s)`)

    if (!inventoryRecords || inventoryRecords.length === 0) {
      return {
        success: true,
        data: [],
        error: itemId ? `No inventory found for item: ${itemId}` : warehouseId ? `No inventory found for warehouse: ${warehouseId}` : undefined
      }
    }

    // Enrich with product information
    const inventoryData = await Promise.all(
      inventoryRecords.map(async (record: any) => {
        let productLabel = 'Unknown Product'
        try {
          const product = await emcInvItem.findById(record.itemId).lean()
          if (product) {
            productLabel = product.gbItem?.Name || product.label || 'Unknown'
          }
        } catch (err) {
          console.warn(`Could not fetch product info for item ${record.itemId}:`, err)
        }

        return {
          _id: record._id?.toString(),
          itemId: record.itemId,
          itemLabel: productLabel,
          warehouseId: record.containerId,
          quantityOnHand: record.quantityOnHand || 0,
          quantityReserved: record.quantityReserved || 0,
          quantityAvailable: record.quantityAvailable || 0
        }
      })
    )

    console.log('📊 Inventory Data:')
    inventoryData.forEach((inv: any) => {
      console.log(`   Item ${inv.itemId}: OnHand=${inv.quantityOnHand}, Reserved=${inv.quantityReserved}, Available=${inv.quantityAvailable}`)
    })

    console.log('\n🎉 Returning inventory data')
    return {
      success: true,
      data: inventoryData
    }
  } catch (error) {
    console.error('\n' + '='.repeat(80))
    console.error('❌ [API] Get Inventory Error!')
    console.error('='.repeat(80))
    console.error('Error:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    }
    console.error('='.repeat(80))

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch inventory'
    }
  }
})
