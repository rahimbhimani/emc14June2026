/**
 * Inventory Indexes Setup
 * 
 * Creates required MongoDB indexes for inventory collections.
 * 
 * Required Indexes (per specification):
 * 
 * containerInventory:
 *   - { organizationId: 1, containerId: 1, itemId: 1 } (unique compound index)
 * 
 * emcInventoryMovements:
 *   - { organizationId: 1, containerId: 1 }
 *   - { organizationId: 1, itemId: 1 }
 *   - { performedAt: -1 }
 * 
 * Run this during application initialization or setup phase.
 */

import { containerInventory } from '~/server/models/containerInventory'
import { emcInventoryMovements } from '~/server/models/emcInventoryMovements'

export async function setupInventoryIndexes(): Promise<void> {
    try {
        console.log('\n' + '='.repeat(80))
        console.log('📑 Setting up Inventory Indexes')
        console.log('='.repeat(80))

        // ========== containerInventory Indexes ==========
        console.log('\n📋 containerInventory collection:')

        // Unique compound index (already defined in schema, but we ensure it exists)
        try {
            const containerInvIndexes: Array<{ name: string; spec: any; options: any }> = [
                {
                    name: 'organizationId_1_containerId_1_itemId_1',
                    spec: { organizationId: 1, containerId: 1, itemId: 1 },
                    options: { unique: true }
                }
            ]

            for (const indexDef of containerInvIndexes) {
                await containerInventory.collection.createIndex(
                    indexDef.spec,
                    indexDef.options
                )
                console.log(`   ✅ Index created: ${indexDef.name}`)
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            if (!errorMsg.includes('already exists')) {
                console.log(`   ⚠️ Warning creating indexes: ${errorMsg}`)
            } else {
                console.log(`   ✅ Index already exists`)
            }
        }

        // ========== emcInventoryMovements Indexes ==========
        console.log('\n📋 emcInventoryMovements collection:')

        const movementIndexes: Array<{ name: string; spec: any; options: any }> = [
            {
                name: 'organizationId_1_containerId_1',
                spec: { organizationId: 1, containerId: 1 },
                options: {}
            },
            {
                name: 'organizationId_1_itemId_1',
                spec: { organizationId: 1, itemId: 1 },
                options: {}
            },
            {
                name: 'performedAt_-1',
                spec: { performedAt: -1 },
                options: {}
            }
        ]

        for (const indexDef of movementIndexes) {
            try {
                await emcInventoryMovements.collection.createIndex(
                    indexDef.spec as any,
                    indexDef.options
                )
                console.log(`   ✅ Index created: ${indexDef.name}`)
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error)
                if (!errorMsg.includes('already exists')) {
                    console.log(`   ⚠️ Warning creating index: ${errorMsg}`)
                } else {
                    console.log(`   ✅ Index already exists: ${indexDef.name}`)
                }
            }
        }

        console.log('\n✅ All indexes setup completed')
        console.log('='.repeat(80))
    } catch (error) {
        console.error('❌ Error setting up indexes:', error)
        throw error
    }
}
