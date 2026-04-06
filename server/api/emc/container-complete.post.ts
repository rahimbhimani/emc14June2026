import { emcContainers } from '~/server/models/emcContainers'
import { updateContainerStatus } from '~/server/utils/containerStatusManager'
import type { UserContext } from '~/types/emcContainer'

interface CompletePayload {
    containerId: string
    organizationId: string | number
}

interface CompleteResponse {
    success: boolean
    data?: any
    error?: string
    message?: string
}

export default defineEventHandler(async (event): Promise<CompleteResponse> => {
    try {
        console.log('=== EMC Container Close API Called ===')

        // Get user context from session/auth (mock for now)
        const userContext: UserContext = {
            id: 'user-123',
            organizationId: 12313,
            roles: [
                { id: 9090, name: 'Admin' },
                { id: 9091, name: 'Manager' }
            ]
        }
        const userName = 'Rahim Bhimani'
        const userCode = 'EMP-001'

        console.log('User Context:', userContext)

        // Parse request body
        const body = await readBody<CompletePayload>(event)
        console.log('Close Payload:', body)

        // Validate required fields
        if (!body.containerId) {
            return {
                success: false,
                error: 'Missing required field: containerId'
            }
        }

        // Validate organization ID matches user's organization
        const orgId = typeof body.organizationId === 'string' ? parseInt(body.organizationId) : body.organizationId
        if (orgId !== userContext.organizationId && body.organizationId !== 'default') {
            return {
                success: false,
                error: 'Unauthorized: Organization ID mismatch'
            }
        }

        const container = await emcContainers.findOne({
            id: body.containerId,
            organizationId: userContext.organizationId,
        })

        if (!container) {
            return {
                success: false,
                error: `Container not found: ${body.containerId}`,
            }
        }

        // Use status manager to handle close action with cascading to active children
        const statusResult = await updateContainerStatus(
            body.containerId,
            'Close',
            {
                id: userContext.id,
                name: userName,
                code: userCode,
            }
        )

        if (!statusResult.success) {
            return {
                success: false,
                error: statusResult.message,
            }
        }

        console.log(`Container ${body.containerId} marked as CLOSED with ${statusResult.updatedContainers?.length || 0} containers updated`)

        // Return success response
        return {
            success: true,
            data: {
                containerId: body.containerId,
                updatedContainers: statusResult.updatedContainers,
                totalUpdated: statusResult.updatedContainers?.length || 0,
                message: statusResult.message,
            },
            message: 'Container successfully closed'
        }
    } catch (error) {
        console.error('Close API Error:', error)

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to close container'
        }
    }
})
