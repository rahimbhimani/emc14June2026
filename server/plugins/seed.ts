
export default defineNitroPlugin(async (nitroApp) => {
    console.log('🚀 Database seeding plugin loaded (seeding disabled - manual creation only)')

    // Seeding disabled - manually create data via MongoDB console or API
    // To enable: uncomment lines below
    // try {
    //     await seed_OrganizationContainerConfigs()
    //     await seed_EMCContainers()
    //     console.log('✅ All seeds completed successfully')
    // } catch (error) {
    //     console.error('❌ Error during seed execution:', error)
    // }
})
