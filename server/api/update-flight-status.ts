export default defineEventHandler(async (event) => {
  try {
    // Check if mongodb package is available
    const { MongoClient, ObjectId } = await import('mongodb').catch(() => {
      throw new Error('MongoDB package not installed. Run: npm install mongodb')
    })
    
    const config = useRuntimeConfig()
    
    // Get MongoDB connection string from runtime config or environment
    const mongoUri = config.mongodbUri || process.env.MONGODB_URI || 'mongodb://localhost:27017'
    const dbName = 'EMC' // Database name
    const collectionName = 'emcFlight' // Collection name
    
    console.log('=== Update Flight Status API Called ===')
    
    let client: any = null

    try {
      // Connect to MongoDB
      client = new MongoClient(mongoUri)
      await client.connect()
      console.log('MongoDB connected successfully')
      
      const database = client.db(dbName)
      const flightsCollection = database.collection(collectionName)
      
      // Handle PATCH request - Update flight status
      if (event.method === 'PATCH') {
        const body = await readBody(event)
        const { flightId, status } = body
        
        console.log('Updating flight status:', { flightId, status })
        
        if (!flightId || !status) {
          return {
            success: false,
            error: 'flightId and status are required',
          }
        }
        
        // Validate status
        const validStatuses = ['Available', 'Under Planning', 'Planned']
        if (!validStatuses.includes(status)) {
          return {
            success: false,
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          }
        }
        
        // Update the flight status
        const result = await flightsCollection.updateOne(
          { _id: new ObjectId(flightId) },
          { 
            $set: { 
              'tbFlightInfo.tbBasicDetails.Status': status,
              'tbFlightInfo.tbBasicDetails.UpdatedAt': new Date()
            } 
          }
        )
        
        console.log('Update result:', result)
        
        if (result.matchedCount === 0) {
          return {
            success: false,
            error: 'Flight not found',
          }
        }
        
        return {
          success: true,
          data: {
            flightId,
            status,
            modified: result.modifiedCount > 0,
          },
        }
      }
      
      return {
        success: false,
        error: 'Method not supported. Use PATCH to update status.',
      }
      
    } catch (error) {
      console.error('Error updating flight status:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    } finally {
      // Close MongoDB connection
      if (client) {
        await client.close()
        console.log('MongoDB connection closed')
      }
    }
  } catch (error) {
    console.error('Fatal error in update flight status API:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
})
