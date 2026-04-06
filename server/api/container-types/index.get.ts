import { CONTAINER_TYPES } from '~/server/config/containerTypes'

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)
        const { typeKey } = query

        // If specific type requested
        if (typeKey) {
            const containerType = CONTAINER_TYPES.find(t => t.typeKey === typeKey)

            if (!containerType) {
                throw createError({
                    statusCode: 404,
                    message: `Container type not found: ${typeKey}`,
                })
            }

            return {
                success: true,
                data: containerType,
            }
        }

        // Return all types
        return {
            success: true,
            data: CONTAINER_TYPES,
            count: CONTAINER_TYPES.length,
        }

    } catch (error: any) {
        console.error('Error fetching container types:', error)

        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to fetch container types',
        })
    }
})
