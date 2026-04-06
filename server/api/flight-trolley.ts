export default defineEventHandler(async (event) => {
  try {
    // Check if mongodb package is available
    const { MongoClient } = await import('mongodb').catch(() => {
      throw new Error('MongoDB package not installed. Run: npm install mongodb')
    })
    
    const config = useRuntimeConfig()
    
    // Get MongoDB connection string from runtime config or environment
    const mongoUri = config.mongodbUri || process.env.MONGODB_URI || 'mongodb://localhost:27017'
    const dbName = 'EMC' // Database name
    const collectionName = 'emcFlightTrolley' // Collection name
    
    console.log('=== Flight-Trolley API Called ===')
    console.log('MongoDB URI:', mongoUri)
    console.log('Database:', dbName)
    console.log('Collection:', collectionName)
    
    let client: any = null

    try {
      // Connect to MongoDB
      client = new MongoClient(mongoUri)
      await client.connect()
      console.log('MongoDB connected successfully')
      
      const database = client.db(dbName)
      const flightTrolleyCollection = database.collection(collectionName)
      
      // Handle POST request - Save flight-trolley associations
      if (event.method === 'POST') {
        const body = await readBody(event)
        const { flightId, trolleyIds } = body
        
        console.log('Saving flight-trolley associations:', { flightId, trolleyIds })
        
        if (!flightId || !trolleyIds || !Array.isArray(trolleyIds)) {
          return {
            success: false,
            error: 'Invalid request: flightId and trolleyIds array required',
          }
        }
        
        // Create documents for each trolley associated with the flight
        const documents = trolleyIds.map(trolleyId => ({
          flightId,
          trolleyId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
        
        // First, remove any existing associations for this flight
        await flightTrolleyCollection.deleteMany({ flightId })
        console.log('Removed existing associations for flight:', flightId)
        
        // Insert new associations
        if (documents.length > 0) {
          const result = await flightTrolleyCollection.insertMany(documents)
          console.log('Inserted associations:', result.insertedCount)
                    // Update flight status to "Under Planning"
          try {
            const { ObjectId } = await import('mongodb')
            const flightCollection = database.collection('emcFlight')
            await flightCollection.updateOne(
              { _id: new ObjectId(flightId) },
              { 
                $set: { 
                  'tbFlightInfo.tbBasicDetails.Status': 'Under Planning',
                  'tbFlightInfo.tbBasicDetails.UpdatedAt': new Date()
                } 
              }
            )
            console.log('Flight status updated to "Under Planning"')
          } catch (updateError) {
            console.error('Error updating flight status:', updateError)
            // Don't fail the whole operation if status update fails
          }
                    return {
            success: true,
            data: {
              insertedCount: result.insertedCount,
              flightId,
              trolleyIds,
            },
          }
        } else {
          return {
            success: true,
            data: {
              insertedCount: 0,
              flightId,
              trolleyIds: [],
            },
          }
        }
      }
      
      // Handle GET request - Retrieve trolleys for a flight
      if (event.method === 'GET') {
        const query = getQuery(event)
        const flightId = query.flightId as string | undefined
        
        if (!flightId) {
          return {
            success: false,
            error: 'flightId parameter required',
          }
        }
        
        console.log('Fetching trolleys for flight:', flightId)
        
        const associations = await flightTrolleyCollection
          .find({ flightId })
          .toArray()
        
        const trolleyIds = associations.map((assoc: any) => assoc.trolleyId)
        
        console.log('Found trolley associations:', trolleyIds)
        
        return {
          success: true,
          data: {
            flightId,
            trolleyIds,
            associations,
          },
        }
      }
      
      return {
        success: false,
        error: 'Method not supported',
      }
      
    } catch (error) {
      console.error('Error in flight-trolley API:', error)
      
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
    console.error('Fatal error in flight-trolley API:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
})
