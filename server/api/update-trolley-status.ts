import { MongoClient, ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  console.log('Update Trolley Status API called')

  // Only allow PATCH requests
  if (event.method !== 'PATCH') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed',
    })
  }

  const config = useRuntimeConfig()
  const mongodbUri = config.mongodbUri

  if (!mongodbUri) {
    console.error('MongoDB URI not configured')
    return {
      success: false,
      error: 'Database configuration error',
    }
  }

  let client: MongoClient | null = null

  try {
    // Get request body
    const body = await readBody(event)
    const { trolleyId, status } = body

    console.log('Request body:', { trolleyId, status })

    // Validate inputs
    if (!trolleyId || !status) {
      return {
        success: false,
        error: 'Trolley ID and status are required',
      }
    }

    // Validate status values
    const validStatuses = ['Available', 'Under Planning', 'Planned', 'READY', 'IN_USE']
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      }
    }

    // Connect to MongoDB
    client = new MongoClient(mongodbUri)
    await client.connect()

    const db = client.db('EMC')
    const collection = db.collection('emcTrolley')

    // Update trolley status
    const result = await collection.updateOne(
      { _id: new ObjectId(trolleyId) },
      {
        $set: {
          'tbTrolley.tbMain.Status': status,
          'tbTrolley.tbMain.UpdatedAt': new Date(),
        },
      }
    )

    console.log('Update result:', result)

    if (result.matchedCount === 0) {
      return {
        success: false,
        error: 'Trolley not found',
      }
    }

    return {
      success: true,
      message: 'Trolley status updated successfully',
    }
  }
  catch (error) {
    console.error('Error updating trolley status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update trolley status',
    }
  }
  finally {
    if (client) {
      await client.close()
    }
  }
})
