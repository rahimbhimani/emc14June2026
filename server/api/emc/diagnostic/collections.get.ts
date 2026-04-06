/**
 * Diagnostic: List all collections in MongoDB
 * GET /api/emc/diagnostic/collections
 */

import mongoose from 'mongoose'

export default defineEventHandler(async (event) => {
    try {
        console.log('\n🔍 Listing all MongoDB collections...')

        const db = mongoose.connection.db
        if (!db) {
            return {
                success: false,
                error: 'No database connection'
            }
        }

        const collections = await db.listCollections().toArray()
        const collectionNames = collections.map(c => c.name)

        console.log(`Found ${collectionNames.length} collections:`)
        collectionNames.forEach(name => console.log(`  - ${name}`))

        return {
            success: true,
            database: db.getName(),
            collections: collectionNames,
            count: collectionNames.length
        }
    } catch (error) {
        console.error('Error listing collections:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to list collections'
        }
    }
})
