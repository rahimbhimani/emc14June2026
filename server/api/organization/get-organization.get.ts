import { emcOrganization } from '~/server/models/emcOrganization'
import { getUserFromEvent } from '~/server/utils/auth'

export default defineEventHandler(async event => {
    // Get user from session
    const user = await getUserFromEvent(event)

    try {
        const org =
            await emcOrganization.findOne({
                organizationId:
                    user.organizationId,
                isActive: true,
            })

        if (!org) {
            throw createError({
                statusCode: 404,
                statusMessage:
                    'Organization not found',
            })
        }

        return {
            success: true,
            organization: org,
        }
    } catch (error: any) {
        throw createError({
            statusCode:
                error.statusCode || 500,
            statusMessage:
                error.message ||
                'Failed to fetch organization',
        })
    }
})
