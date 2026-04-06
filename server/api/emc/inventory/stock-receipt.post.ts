/**
 * Stock Receipt API Endpoint
 * 
 * POST /api/emc/inventory/stock-receipt
 * 
 * Receives stock into warehouse.
 * 
 * Request Body:
 * {
 *   organizationId: number,
 *   warehouseId: string,
 *   itemId: string,
 *   quantity: number,
 *   reference?: string,
 *   remarks?: string,
 *   performedBy: string
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   data?: { movementId, inventoryId, previousQuantity, newQuantity }
 * }
 */

import mongoose from 'mongoose'
import type { StockReceiptRequest } from '~/server/utils/stockReceiptService'
import { processStockReceipt } from '~/server/utils/stockReceiptService'

interface ApiResponse {
    success: boolean
    message: string
    data?: any
    error?: string
}

export default defineEventHandler(async (event): Promise<ApiResponse> => {
    try {
        console.log('\n' + '='.repeat(80))
        console.log('🔵 [API] Stock Receipt Endpoint Called')
        console.log('='.repeat(80))

        // Read request body
        const body = await readBody<StockReceiptRequest>(event)

        // Validate required fields in request body
        const requiredFields = [
            'organizationId',
            'warehouseId',
            'itemId',
            'quantity',
            'performedBy'
        ]

        const missingFields = requiredFields.filter(field => {
            const value = (body as any)[field]
            return value === undefined || value === null || value === ''
        })

        if (missingFields.length > 0) {
            console.log(`❌ Missing required fields: ${missingFields.join(', ')}`)
            return {
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`,
                error: `Missing required fields: ${missingFields.join(', ')}`
            }
        }

        console.log('📥 Request body:', JSON.stringify(body, null, 2))

        // Get MongoDB session for transaction
        const mongoClient = mongoose.connection.getClient()
        const session = mongoClient.startSession()

        try {
            // Start transaction
            await session.withTransaction(async () => {
                console.log('   🔒 Transaction started')
            })

            // Process stock receipt (with transaction support)
            const result = await processStockReceipt(body, session)

            if (!result.success) {
                console.log(`❌ Stock Receipt processing failed: ${result.error}`)
                return {
                    success: false,
                    message: result.message,
                    error: result.error
                }
            }

            console.log('✅ API Response: Success')
            return {
                success: true,
                message: 'StockReceipt completed successfully',
                data: result.data
            }
        } finally {
            await session.endSession()
        }
    } catch (error) {
        console.log('\n❌ [API] Stock Receipt Failed')
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.log(`Error: ${errorMessage}`)
        console.log('='.repeat(80))

        return {
            success: false,
            message: 'StockReceipt operation failed',
            error: errorMessage
        }
    }
})
