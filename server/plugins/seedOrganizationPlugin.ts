
export default defineNitroPlugin(async (nitroApp) => {
    // Database seeding disabled
    console.log('🚀 Organization data seeding plugin loaded (seeding disabled)')

    // Seeding disabled - manually create data via MongoDB console or API
    // To enable: uncomment lines below
    // // Wait for MongoDB connection to be ready
    // let retries = 0
    // const maxRetries = 10
    // const retryDelay = 1000 // 1 second

    // while (retries < maxRetries) {
    //     if (
    //         mongoose.connection.readyState === 1
    //     ) {
    //         // Connection is open
    //         console.log(
    //             '🌱 MongoDB ready, seeding organization data...'
    //         )

    //         try {
    //             await seedOrganizationData()
    //             console.log(
    //                 '✅ Organization data seeding completed'
    //             )
    //             return
    //         } catch (err) {
    //             console.error(
    //                 '⚠️ Failed to seed organization data:',
    //                 err
    //             )
    //             return
    //         }
    //     }

    //     retries++
    //     if (retries < maxRetries) {
    //         console.log(
    //             `⏳ Waiting for MongoDB connection... (attempt ${retries}/${maxRetries})`
    //         )
    //         await new Promise(resolve =>
    //             setTimeout(resolve, retryDelay)
    //         )
    //     }
    // }

    // console.warn(
    //     '⚠️ MongoDB connection not ready after retries, skipping seed'
    // )
})
