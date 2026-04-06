import { Container } from '~/server/models/Container'

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event)
        const { parentId, typeKey, status, organizationId } = query

        // Build filter
        const filter: any = {}

        // In real app, get from session
        filter.organizationId = organizationId || 'org-001'

        if (parentId) {
            filter.parentContainerId = parentId
        }

        if (typeKey) {
            filter.typeKey = typeKey
        }

        if (status) {
            filter.status = status
        }

        // Fetch containers
        const containers = await Container.find(filter)
            .sort({ createdAt: -1 })
            .lean()

        return {
            success: true,
            data: containers,
            count: containers.length,
        }

    } catch (error: any) {
        console.error('Error fetching containers:', error)

        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to fetch containers',
        })
    }
})
