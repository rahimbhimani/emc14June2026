/**
 * Create Product Master API Endpoint
 * 
 * POST /api/emc/inventory/create-product
 * 
 * Creates a new product master in emcInvItem collection.
 */

import { emcInvItem } from '~/server/models/emcInvItem'

interface CreateProductPayload {
    organizationId: number
    sku: string
    name: string
    lifecycle?: 'ACTIVE' | 'DRAFT' | 'SUSPENDED' | 'ARCHIVED'
}

interface CreateProductResponse {
    success: boolean
    data?: any
    error?: string
    message?: string
}

export default defineEventHandler(async (event): Promise<CreateProductResponse> => {
    try {
        console.log('\n' + '='.repeat(80))
        console.log('🔵 [API] Create Product Master Called')
        console.log('='.repeat(80))

        const body = await readBody<CreateProductPayload>(event)

        // Validate required fields
        if (!body.organizationId || !body.sku || !body.name) {
            console.log('❌ Missing required fields')
            return {
                success: false,
                error: 'Missing required fields: organizationId, sku, name'
            }
        }

        console.log('📦 Request:', JSON.stringify(body, null, 2))

        // Check if product with this SKU already exists
        const existingProduct = await emcInvItem.findOne({
            organizationId: body.organizationId,
            sku: body.sku
        })

        if (existingProduct) {
            console.log('⚠️ Product with this SKU already exists:', body.sku)
            return {
                success: false,
                error: `Product with SKU "${body.sku}" already exists`
            }
        }

        // Create new product
        const product = await emcInvItem.create({
            organizationId: body.organizationId,
            sku: body.sku,
            name: body.name,
            lifecycle: body.lifecycle || 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date()
        })

        console.log('✅ Product created:', product._id)

        return {
            success: true,
            message: 'Product master created successfully',
            data: {
                _id: product._id?.toString(),
                sku: product.sku,
                name: product.name,
                lifecycle: product.lifecycle,
                organizationId: product.organizationId
            }
        }
    } catch (error) {
        console.error('❌ Error creating product:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create product'
        }
    }
})
