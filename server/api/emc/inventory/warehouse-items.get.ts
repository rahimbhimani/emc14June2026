import { ContainerAssociation } from '~/server/models/ContainerAssociation'
import { containerInventory } from '~/server/models/containerInventory'
import { emcContainers } from '~/server/models/emcContainers'
import { emcInvItem } from '~/server/models/emcInvItem'
import type { UserContext } from '~/types/emcContainer'

interface WarehouseItemsResponse {
  success: boolean
  data?: any[]
  error?: string
}

/**
 * Get all warehouse items with quantities
 * Returns items from all warehouses that are associated (attached) via ContainerAssociation
 * Falls back to containerInventory if stock receipt has been processed
 */
export default defineEventHandler(async (event): Promise<WarehouseItemsResponse> => {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('📦 [API] Get Warehouse Items (for Trolley Loading)')
    console.log('='.repeat(80))

    // Get user context
    const userContext: UserContext = {
      id: 'user-123',
      organizationId: 12313,
      roles: [
        { id: 9090, name: 'Admin' },
        { id: 9091, name: 'Manager' }
      ]
    }

    const orgId = userContext.organizationId
    console.log(`🔍 Fetching warehouse inventories for org: ${orgId}`)

    // Strategy 1: Try to get from containerInventory (stock receipt data)
    console.log('📊 Strategy 1: Checking containerInventory for stock receipt data...')
    let inventoryRecords = await containerInventory.find({
      organizationId: orgId,
      containerType: 'Warehouse',
      quantityOnHand: { $gt: 0 }
    }).lean()

    console.log(`   Found ${inventoryRecords?.length || 0} records from containerInventory`)

    // Strategy 2: If no containerInventory data, get from ContainerAssociation (associations)
    if (!inventoryRecords || inventoryRecords.length === 0) {
      console.log('📊 Strategy 2: Checking ContainerAssociation for attached items...')

      // Find all associations where parent is a Warehouse
      const warehouseAssociations = await ContainerAssociation.find({
        organizationId: orgId,
        parentContainerType: 'Warehouse',
        status: 'active'
      }).lean()

      console.log(`   Found ${warehouseAssociations?.length || 0} warehouse associations`)

      if (warehouseAssociations && warehouseAssociations.length > 0) {
        console.log('   Building inventory records from associations...')

        // Convert associations to inventory records
        inventoryRecords = []
        for (const assoc of warehouseAssociations) {
          if (assoc.childContainerIds && Array.isArray(assoc.childContainerIds)) {
            for (const childId of assoc.childContainerIds) {
              const quantity = (assoc.itemQuantities as any)?.[childId] || 1
              inventoryRecords.push({
                containerId: assoc.parentContainerId,
                itemId: childId,
                quantityOnHand: quantity,
                quantityAvailable: quantity,
                _id: `${assoc.parentContainerId}-${childId}` // Virtual ID
              })
              console.log(`     - ${assoc.parentContainerId}: ${childId} x${quantity} (from association)`)
            }
          }
        }
      }
    }

    console.log(`✅ Found ${inventoryRecords?.length || 0} inventory records total`)

    if (!inventoryRecords || inventoryRecords.length === 0) {
      console.log('⚠️  No items found in either containerInventory or ContainerAssociation')
      return {
        success: true,
        data: []
      }
    }

    // Enrich with warehouse and product information
    const itemsData = await Promise.all(
      inventoryRecords.map(async (record: any) => {
        let warehouseLabel = record.containerId
        let itemLabel = record.itemId

        try {
          // Get warehouse info
          const warehouse = await emcContainers.findOne({ id: record.containerId }).lean()
          if (warehouse) {
            warehouseLabel = warehouse.label || warehouse.id
          }

          // Get item info
          const product = await emcInvItem.findById(record.itemId).lean()
          if (product) {
            itemLabel = product.gbItem?.Name || product.name || product.sku || record.itemId
          }
        } catch (err) {
          console.warn(`Could not enrich data for item ${record.itemId}:`, err)
        }

        return {
          _id: record._id?.toString(),
          warehouseId: record.containerId,
          warehouseLabel: warehouseLabel,
          itemId: record.itemId,
          itemLabel: itemLabel,
          quantityOnHand: record.quantityOnHand,
          quantityAvailable: record.quantityAvailable || record.quantityOnHand
        }
      })
    )

    console.log(`✅ Enriched data for ${itemsData.length} items`)
    console.log('📊 Sample items:')
    itemsData.slice(0, 3).forEach((item: any) => {
      console.log(`   ${item.itemLabel} in ${item.warehouseLabel}: ${item.quantityOnHand} units`)
    })

    console.log('\n' + '='.repeat(80))
    return {
      success: true,
      data: itemsData
    }
  } catch (error) {
    console.error('\n' + '='.repeat(80))
    console.error('❌ Error fetching warehouse items')
    console.error('='.repeat(80))
    console.error('Error:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch warehouse items'
    }
  }
})
