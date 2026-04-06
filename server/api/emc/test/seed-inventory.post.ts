import { containerInventory } from '~/server/models/containerInventory'
import { emcContainers } from '~/server/models/emcContainers'
import { emcInvItem } from '~/server/models/emcInvItem'

interface SeedResponse {
    success: boolean
    message: string
    recordsCreated?: number
    data?: any[]
    error?: string
}

/**
 * Seed test data into containerInventory
 * Creates sample warehouse inventory records for testing trolley loading
 */
export default defineEventHandler(async (event): Promise<SeedResponse> => {
    try {
        const orgId = 12313
        console.log('\n' + '='.repeat(80))
        console.log('🌱 [TEST DATA] Seeding containerInventory')
        console.log('='.repeat(80))

        // Find a warehouse
        const warehouse = await emcContainers.findOne({
            organizationId: orgId,
            type: 'Warehouse'
        }).lean()

        if (!warehouse) {
            return {
                success: false,
                message: 'No warehouse found. Please create a warehouse first.'
            }
        }

        console.log(`✅ Found warehouse: ${warehouse.id} (${warehouse.label})`)

        // Find some items
        const items = await emcInvItem.find({}).limit(5).lean()

        if (!items || items.length === 0) {
            return {
                success: false,
                message: 'No items found. Please create items first.'
            }
        }

        console.log(`✅ Found ${items.length} items`)

        // Create sample inventory records
        const createdRecords = []

        for (const item of items) {
            const record = await containerInventory.findOneAndUpdate(
                {
                    organizationId: orgId,
                    containerId: warehouse.id,
                    itemId: item._id?.toString() || item.id
                },
                {
                    organizationId: orgId,
                    containerId: warehouse.id,
                    containerType: 'Warehouse',
                    itemId: item._id?.toString() || item.id,
                    quantityOnHand: Math.floor(Math.random() * 100) + 50, // Random qty between 50-150
                    quantityReserved: 0,
                    quantityAvailable: Math.floor(Math.random() * 100) + 50,
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            )

            if (record) {
                createdRecords.push({
                    _id: record._id,
                    warehouseId: warehouse.id,
                    itemId: record.itemId,
                    quantityOnHand: record.quantityOnHand
                })
                console.log(`   ✅ Created: ${record.itemId} x${record.quantityOnHand} units`)
            }
        }

        console.log('\n✅ Seed completed successfully')
        console.log(`📊 Total records created/updated: ${createdRecords.length}`)
        console.log('='.repeat(80))

        return {
            success: true,
            message: `Successfully seeded ${createdRecords.length} inventory records`,
            recordsCreated: createdRecords.length,
            data: createdRecords
        }
    } catch (error) {
        console.error('\n' + '='.repeat(80))
        console.error('❌ Error seeding data')
        console.error('='.repeat(80))
        console.error('Error:', error)

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to seed data',
            message: 'Failed to seed inventory data'
        }
    }
})
