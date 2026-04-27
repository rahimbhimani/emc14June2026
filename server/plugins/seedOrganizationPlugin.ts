import { seedOrganizationData } from '~/server/utils/seedOrganization'

export default defineNitroPlugin(() => {
    // Seed organization data on app startup
    seedOrganizationData().catch(err => {
        console.error(
            '⚠️ Failed to seed organization data:',
            err
        )
    })
})
