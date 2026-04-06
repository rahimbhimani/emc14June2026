import { MongoClient } from 'mongodb'

const uri = 'mongodb://localhost:27017'
const client = new MongoClient(uri)

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { trolleyIds } = query

    if (!trolleyIds) {
      return {
        success: false,
        error: 'Trolley IDs are required',
      }
    }

    await client.connect()
    const db = client.db('EMC')
    const collection = db.collection('emcTrolleyItem')

    // Parse trolley IDs (comma-separated)
    const ids = (trolleyIds as string).split(',')

    // Get item counts for each trolley
    const loadingStatus: Record<string, number> = {}

    for (const trolleyId of ids) {
      const count = await collection.countDocuments({ trolleyId })
      loadingStatus[trolleyId] = count
    }

    return {
      success: true,
      data: loadingStatus,
    }
  } catch (error) {
    console.error('Error fetching trolley loading status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  } finally {
    await client.close()
  }
})
