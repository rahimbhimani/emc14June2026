import { emcOrganization } from '~/server/models/emcOrganization'

/**
 * Diagnostic endpoint to check organization data
 * Usage: GET /api/seed/check-organizations
 */
export default defineEventHandler(async event => {
    try {
        const count = await emcOrganization.countDocuments()
        const orgs = await emcOrganization.find({}).limit(10)

        return {
            success: true,
            totalCount: count,
            sample: orgs,
            message:
                count > 0
                    ? `Found ${count} organizations`
                    : 'No organizations found - please run seed first',
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
            message:
                'Failed to check organization data',
        }
    }
})
