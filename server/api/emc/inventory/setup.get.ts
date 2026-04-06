/**
 * Inventory Setup Endpoint
 * 
 * GET /api/emc/inventory/setup
 * 
 * Initializes inventory system:
 * - Creates required MongoDB indexes
 * - Validates collections exist
 * 
 * This endpoint should be called once after deployment.
 */

import { setupInventoryIndexes } from '~/server/utils/setupInventoryIndexes'

interface SetupResponse {
    success: boolean
    message: string
    timestamp: string
}

export default defineEventHandler(async (event): Promise<SetupResponse> => {
    try {
        console.log('\n' + '='.repeat(80))
        console.log('🔧 [API] Inventory Setup Endpoint Called')
        console.log('='.repeat(80))

        await setupInventoryIndexes()

        return {
            success: true,
            message: 'Inventory system setup completed successfully',
            timestamp: new Date().toISOString()
        }
    } catch (error) {
        console.log('\n❌ Setup Failed')
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.log(`Error: ${errorMessage}`)
        console.log('='.repeat(80))

        return {
            success: false,
            message: `Setup failed: ${errorMessage}`,
            timestamp: new Date().toISOString()
        }
    }
})
