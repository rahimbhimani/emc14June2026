import mongoose from 'mongoose'

export default defineNitroPlugin(async (nitroApp) => {
    const config = useRuntimeConfig()

    // Get MongoDB URI from environment or use local default
    const mongodbUri = config.mongodbUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/emc-app'

    if (!mongodbUri) {
        console.warn('⚠️  MONGODB_URI not configured. Using: mongodb://localhost:27017/emc-app')
    }

    try {
        console.log('🔗 Connecting to MongoDB...')

        await mongoose.connect(mongodbUri, {
            bufferCommands: false,
        })

        console.log('✅ MongoDB connected successfully')
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error instanceof Error ? error.message : error)
        // Continue server startup even if DB connection fails
        // This allows for graceful degradation
    }
})
