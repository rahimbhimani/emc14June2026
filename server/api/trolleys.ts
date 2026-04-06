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
    const collectionName = 'emcTrolley' // Collection name
    
    console.log('=== Trolley API Called ===')
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
      const trolleysCollection = database.collection(collectionName)
      
      // Get query parameters for filtering
      const query = getQuery(event)
      const searchTerm = query.search as string | undefined
      
      console.log('Query params:', { searchTerm })
      
      // Build MongoDB query for nested structure
      const filter: any = {}
      
      if (searchTerm) {
        filter.$or = [
          { 'tbTrolley.tbMain.IDX': { $regex: searchTerm, $options: 'i' } },
          { 'tbTrolley.tbMain.Name': { $regex: searchTerm, $options: 'i' } },
          { 'tbTrolley.tbMain.ColumnName.title': { $regex: searchTerm, $options: 'i' } },
          { 'tbTrolley.tbMain.Location.title': { $regex: searchTerm, $options: 'i' } },
        ]
      }
      
      console.log('MongoDB filter:', JSON.stringify(filter))
      
      // Fetch trolleys from MongoDB
      const trolleys = await trolleysCollection
        .find(filter)
        .sort({ 'tbTrolley.tbMain.Name': 1 })
        .limit(100)
        .toArray()
      
      console.log(`Found ${trolleys.length} trolleys`)
      if (trolleys.length > 0) {
        console.log('Sample trolley:', trolleys[0])
      }
      
      // Transform nested MongoDB structure to flat frontend structure
      const transformedTrolleys = trolleys.map((trolley: any) => {
        const tbMain = trolley.tbTrolley?.tbMain
        
        // Use Name as the code (or IDX if Name is not available)
        const code = tbMain?.Name || tbMain?.IDX || 'N/A'
        
        // Use ColumnName.title as the type
        const type = tbMain?.ColumnName?.title || 'Standard'
        
        // Location
        const location = tbMain?.Location?.title || 'Unknown'
        
        // For now, default capacity and status since they're not in the MongoDB structure
        // You can add these fields to MongoDB later if needed
        const capacity = 120 // Default capacity
        const status = 'READY' // Default status
        
        return {
          id: trolley._id.toString(),
          code: code,
          type: type,
          capacity: capacity,
          status: status,
          location: location,
          manufactureYear: tbMain?.ManufactureYear || 'N/A',
          // Include full original data for reference
          _original: trolley
        }
      })
      
      console.log('Returning trolleys:', transformedTrolleys.length)
      if (transformedTrolleys.length > 0) {
        console.log('Sample transformed trolley:', transformedTrolleys[0])
      }
      
      return {
        success: true,
        data: transformedTrolleys,
        count: transformedTrolleys.length,
      }
    } catch (error) {
      console.error('Error fetching trolleys from MongoDB:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: [],
        count: 0,
      }
    } finally {
      // Close MongoDB connection
      if (client) {
        await client.close()
        console.log('MongoDB connection closed')
      }
    }
  } catch (error) {
    console.error('Fatal error in trolleys API:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: [],
      count: 0,
    }
  }
})
