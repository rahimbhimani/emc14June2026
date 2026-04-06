import { emcInvItem } from '~/server/models/emcInvItem'

interface ItemsResponse {
    success: boolean
    data?: any[]
    error?: string
    message?: string
}

export default defineEventHandler(async (event): Promise<ItemsResponse> => {
    try {
        console.log('\n' + '='.repeat(80))
        console.log('📥 [API] Fetch Items By IDs')
        console.log('='.repeat(80))

        // Parse request body
        const body = await readBody(event)
        const { itemIds } = body

        console.log(`📦 Requested item IDs: ${itemIds?.length || 0}`)
        if (itemIds && itemIds.length > 0) {
            console.log(`   IDs: ${itemIds.slice(0, 5).join(', ')}${itemIds.length > 5 ? '...' : ''}`)
        }

        if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
            return {
                success: false,
                error: 'itemIds must be a non-empty array'
            }
        }

        // Find items by their IDs
        const items = await emcInvItem.find({
            _id: { $in: itemIds }
        }).lean()

        console.log(`✅ Found ${items?.length || 0} items`)

        if (items && items.length > 0) {
            console.log('📋 Sample items:')
            items.slice(0, 3).forEach((item: any) => {
                console.log(`   - ${item._id}: ${item.name}`)
            })
        }

        // Transform items for consistency with all-items endpoint
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

        console.log('\n🎉 Returning transformed items')
        return {
            success: true,
            data: transformedItems || [],
            message: `Found ${transformedItems?.length || 0} item(s)`
        }
    } catch (error) {
        console.error('\n' + '='.repeat(80))
        console.error('❌ [API] Fetch Items By IDs Error!')
        console.error('='.repeat(80))
        console.error('Error:', error)
        if (error instanceof Error) {
            console.error('Message:', error.message)
        }
        console.error('='.repeat(80))

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch items'
        }
    }
})
