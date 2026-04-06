import { ContainerAssociation } from '~/server/models/ContainerAssociation'
import { containerInventory } from '~/server/models/containerInventory'
import { emcInventoryMovements } from '~/server/models/emcInventoryMovements'
import type { UserContext } from '~/types/emcContainer'

interface TransferResponse {
    success: boolean
    message: string
    data?: any
    error?: string
}

/**
 * Transfer inventory from warehouse to trolley
 * 
 * Request body:
 * - organizationId: number
 * - warehouseId: string
 * - trolleyId: string
 * - itemId: string
 * - quantity: number
 * - performedBy: string
 */
export default defineEventHandler(async (event): Promise<TransferResponse> => {
    try {
        console.log('\n' + '='.repeat(80))
        console.log('🚚 [API] Inventory Transfer (Warehouse → Trolley)')
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

        // Parse request body
        const body = await readBody(event)
        const { warehouseId, trolleyId, itemId, quantity, performedBy } = body

        console.log('📦 Request:')
        console.log(`   Warehouse: ${warehouseId}`)
        console.log(`   Trolley: ${trolleyId}`)
        console.log(`   Item: ${itemId}`)
        console.log(`   Quantity: ${quantity}`)
        console.log(`   Performed By: ${performedBy}`)

        // Validate inputs
        if (!warehouseId || !trolleyId || !itemId || !quantity || !performedBy) {
            throw new Error('Missing required fields: warehouseId, trolleyId, itemId, quantity, performedBy')
        }

        const orgId = userContext.organizationId
        const qty = parseInt(quantity)

        if (isNaN(qty) || qty <= 0) {
            throw new Error('Quantity must be a positive number')
        }

        console.log('\n✅ Validation passed')

        // Find warehouse inventory record
        console.log('\n🔍 Checking warehouse inventory...')
        const warehouseInventory = await containerInventory.findOne({
            organizationId: orgId,
            containerId: warehouseId,
            itemId: itemId
        })

        if (!warehouseInventory) {
            throw new Error(`No inventory found in warehouse ${warehouseId} for item ${itemId}`)
        }

        console.log(`   Available: ${warehouseInventory.quantityOnHand}`)

        if (warehouseInventory.quantityOnHand < qty) {
            throw new Error(`Insufficient quantity. Available: ${warehouseInventory.quantityOnHand}, Requested: ${qty}`)
        }

        console.log(`   ✅ Sufficient quantity available`)

        // Find or create trolley inventory record
        console.log('\n🚚 Checking trolley inventory...')
        let trolleyInventory = await containerInventory.findOne({
            organizationId: orgId,
            containerId: trolleyId,
            itemId: itemId
        })

        const trolleyPreviousQty = trolleyInventory?.quantityOnHand || 0
        const trolleyNewQty = trolleyPreviousQty + qty

        if (!trolleyInventory) {
            console.log(`   Creating new trolley inventory record`)
            trolleyInventory = await containerInventory.create([
                {
                    organizationId: orgId,
                    containerId: trolleyId,
                    containerType: 'Trolley',
                    itemId: itemId,
                    quantityOnHand: qty,
                    quantityReserved: 0,
                    quantityAvailable: qty,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ])

            console.log(`   ✅ Created with quantity: ${qty}`)
        } else {
            console.log(`   Updating existing record`)
            await containerInventory.findByIdAndUpdate(
                trolleyInventory._id,
                {
                    quantityOnHand: trolleyNewQty,
                    quantityAvailable: trolleyNewQty - (trolleyInventory.quantityReserved || 0),
                    updatedAt: new Date()
                }
            )
            console.log(`   ✅ Updated from ${trolleyPreviousQty} to ${trolleyNewQty}`)
        }

        // Update warehouse inventory (deduct quantity)
        console.log(`\n🏢 Updating warehouse inventory...`)
        const warehousePreviousQty = warehouseInventory.quantityOnHand
        const warehouseNewQty = warehousePreviousQty - qty

        await containerInventory.findByIdAndUpdate(
            warehouseInventory._id,
            {
                quantityOnHand: warehouseNewQty,
                quantityAvailable: warehouseNewQty - (warehouseInventory.quantityReserved || 0),
                updatedAt: new Date()
            }
        )

        console.log(`   ✅ Deducted from ${warehousePreviousQty} to ${warehouseNewQty}`)

        // Create movement records
        console.log(`\n📋 Creating movement records...`)

        // Warehouse outbound movement
        const warehouseMovement = await emcInventoryMovements.create([
            {
                organizationId: orgId,
                movementType: 'Transfer',
                containerId: warehouseId,
                containerType: 'Warehouse',
                itemId: itemId,
                quantity: -qty, // Negative for outbound
                reference: `TRANSFER-${trolleyId}`,
                remarks: `Transferred to trolley ${trolleyId}`,
                performedBy: performedBy,
                performedAt: new Date(),
                createdAt: new Date()
            }
        ])

        console.log(`   ✅ Warehouse movement: ${warehouseMovement[0]._id}`)

        // Trolley inbound movement
        const trolleyMovement = await emcInventoryMovements.create([
            {
                organizationId: orgId,
                movementType: 'Transfer',
                containerId: trolleyId,
                containerType: 'Trolley',
                itemId: itemId,
                quantity: qty, // Positive for inbound
                reference: `TRANSFER-${warehouseId}`,
                remarks: `Transferred from warehouse ${warehouseId}`,
                performedBy: performedBy,
                performedAt: new Date(),
                createdAt: new Date()
            }
        ])

        console.log(`   ✅ Trolley movement: ${trolleyMovement[0]._id}`)

        // Create ContainerAssociation record to link item to trolley
        console.log(`\n🔗 Creating container association...`)
        try {
            // Check if association already exists
            let association = await ContainerAssociation.findOne({
                organizationId: orgId,
                parentContainerId: trolleyId,
                childContainerIds: itemId
            })

            if (association) {
                // Update existing association with new quantity
                if (!association.itemQuantities) {
                    association.itemQuantities = {}
                }
                const itemQtyMap = association.itemQuantities as Record<string, number>
                const prevQty = itemQtyMap[itemId] || 0
                itemQtyMap[itemId] = prevQty + qty
                await association.save()
                console.log(`   ✅ Updated association quantity for ${itemId}: ${itemQtyMap[itemId]}`)
            } else {
                // Create new association
                const newAssociation = await ContainerAssociation.create({
                    organizationId: orgId,
                    actionId: 'load-item',
                    actionLabel: 'Load Item',
                    parentContainerId: trolleyId,
                    parentContainerType: 'Trolley',
                    childContainerIds: [itemId],
                    itemQuantities: { [itemId]: qty },
                    status: 'active',
                    createdBy: performedBy,
                    createdAt: new Date(),
                    updatedAt: new Date()
                })
                console.log(`   ✅ Created association: ${newAssociation._id}`)
            }
        } catch (assocError) {
            console.warn('   ⚠️ Failed to create association:', assocError)
            // Don't fail the entire transfer if association creation fails
        }

        console.log('\n' + '='.repeat(80))
        console.log('✅ Transfer completed successfully')
        console.log('='.repeat(80))

        return {
            success: true,
            message: 'Inventory transferred successfully',
            data: {
                warehouseMovementId: warehouseMovement[0]._id?.toString(),
                trolleyMovementId: trolleyMovement[0]._id?.toString(),
                quantityTransferred: qty,
                warehousePreviousQuantity: warehousePreviousQty,
                warehouseNewQuantity: warehouseNewQty,
                trolleyPreviousQuantity: trolleyPreviousQty,
                trolleyNewQuantity: trolleyNewQty
            }
        }
    } catch (error) {
        console.error('\n' + '='.repeat(80))
        console.error('❌ Transfer failed')
        console.error('='.repeat(80))
        console.error('Error:', error)
        if (error instanceof Error) {
            console.error('Message:', error.message)
        }
        console.error('='.repeat(80))

        return {
            success: false,
            message: 'Transfer failed',
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
})
