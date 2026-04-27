import { seedOrganizationData } from '~/server/utils/seedOrganization'

/**
 * Seed endpoint for organization data
 * This is a dev/admin endpoint to populate the emcOrganization collection
 * 
 * Usage: POST /api/seed/organizations
 */
export default defineEventHandler(async event => {
    try {
        console.log('Starting organization data seeding...')

        await seedOrganizationData()

        return {
            success: true,
            message: 'Organization data seeded successfully',
        }
    } catch (error: any) {
        console.error('Seeding failed:', error)

        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Failed to seed organization data',
        })
    }
})
