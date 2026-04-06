/**
 * Get All Inventory Items API Endpoint
 * 
 * GET /api/emc/inventory/all-items
 * 
 * Returns list of all items (emcInvItem) for the organization.
 * Used for planning and inventory management views.
 */

import { emcInvItem } from '~/server/models/emcInvItem'

interface GetAllItemsResponse {
    success: boolean
    data?: any[]
    error?: string
}

export default defineEventHandler(async (event): Promise<GetAllItemsResponse> => {
    try {
        console.log('\n' + '='.repeat(80))
        console.log('🔵 [API] Get All Inventory Items Called')
        console.log('='.repeat(80))

        // Get query parameters
        const query = getQuery(event)
        const organizationId = query.organizationId
            ? parseInt(query.organizationId as string)
            : 12313

        console.log(`📦 Organization ID: ${organizationId}`)

        // Fetch all items for the organization
        const items = await emcInvItem.find({
            organizationId
        }).lean()

        console.log(`✅ Found ${items.length} items`)

        // Transform data for frontend
        const transformedItems = items.map((item: any) => ({
            _id: item._id?.toString() || item._id,
            id: item._id?.toString() || item._id,  // Use _id as id for consistency
            sku: item.sku,
            name: item.name,
            label: item.name,  // Use name as label for display
            lifecycle: item.lifecycle || 'ACTIVE',
            organizationId: item.organizationId,
            type: 'Item',  // For consistency with container model
            category: 'Product',
            description: item.sku ? `SKU: ${item.sku}` : undefined
        }))

        console.log(`📦 Returning ${transformedItems.length} items`)

        return {
            success: true,
            data: transformedItems
        }
    } catch (error) {
        console.error('❌ Error fetching items:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch items'
        }
    }
})
