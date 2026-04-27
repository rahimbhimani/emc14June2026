import mongoose from 'mongoose'
import { seedOrganizationData } from '~/server/utils/seedOrganization'

export default defineNitroPlugin(async (nitroApp) => {
    // Wait for MongoDB connection to be ready
    let retries = 0
    const maxRetries = 10
    const retryDelay = 1000 // 1 second

    while (retries < maxRetries) {
        if (
            mongoose.connection.readyState === 1
        ) {
            // Connection is open
            console.log(
                '🌱 MongoDB ready, seeding organization data...'
            )

            try {
                await seedOrganizationData()
                console.log(
                    '✅ Organization data seeding completed'
                )
                return
            } catch (err) {
                console.error(
                    '⚠️ Failed to seed organization data:',
                    err
                )
                return
            }
        }

        retries++
        if (retries < maxRetries) {
            console.log(
                `⏳ Waiting for MongoDB connection... (attempt ${retries}/${maxRetries})`
            )
            await new Promise(resolve =>
                setTimeout(resolve, retryDelay)
            )
        }
    }

    console.warn(
        '⚠️ MongoDB connection not ready after retries, skipping seed'
    )
})
