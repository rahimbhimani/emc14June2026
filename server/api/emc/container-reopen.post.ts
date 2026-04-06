import { emcContainers } from '~/server/models/emcContainers'
import { updateContainerStatus } from '~/server/utils/containerStatusManager'
import type { UserContext } from '~/types/emcContainer'

interface ReopenPayload {
    containerId: string
    organizationId: string | number
}

interface ReopenResponse {
    success: boolean
    data?: any
    error?: string
    message?: string
}

export default defineEventHandler(async (event): Promise<ReopenResponse> => {
    try {
        const userContext: UserContext = {
            id: 'user-123',
            organizationId: 12313,
            roles: [
                { id: 9090, name: 'Admin' },
                { id: 9091, name: 'Manager' },
            ],
        }

        const userName = 'Rahim Bhimani'
        const userCode = 'EMP-001'

        const body = await readBody<ReopenPayload>(event)

        if (!body.containerId)
            return { success: false, error: 'Missing required field: containerId' }

        const orgId = typeof body.organizationId === 'string' ? parseInt(body.organizationId) : body.organizationId
        if (orgId !== userContext.organizationId && body.organizationId !== 'default')
            return { success: false, error: 'Unauthorized: Organization ID mismatch' }

        const container = await emcContainers.findOne({
            id: body.containerId,
            organizationId: userContext.organizationId,
        })

        if (!container)
            return { success: false, error: `Container not found: ${body.containerId}` }

        const statusResult = await updateContainerStatus(
            body.containerId,
            'Reopen',
            {
                id: userContext.id,
                name: userName,
                code: userCode,
            },
        )

        if (!statusResult.success)
            return { success: false, error: statusResult.message }

        return {
            success: true,
            data: {
                containerId: body.containerId,
                updatedContainers: statusResult.updatedContainers,
                totalUpdated: statusResult.updatedContainers?.length || 0,
                message: statusResult.message,
            },
            message: 'Container successfully reopened',
        }
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to reopen container',
        }
    }
})
