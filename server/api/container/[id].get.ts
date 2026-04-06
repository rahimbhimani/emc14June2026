import { Container } from '~/server/models/Container'

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id')

        if (!id) {
            throw createError({
                statusCode: 400,
                message: 'Container ID is required',
            })
        }

        const container = await Container.findById(id).lean()

        if (!container) {
            throw createError({
                statusCode: 404,
                message: 'Container not found',
            })
        }

        return {
            success: true,
            data: container,
        }

    } catch (error: any) {
        console.error('Error fetching container:', error)

        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to fetch container',
        })
    }
})
