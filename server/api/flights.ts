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
    const collectionName = 'emcFlight' // Collection name
    
    console.log('=== Flight API Called ===')
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
      const flightsCollection = database.collection(collectionName)
      
      // Get query parameters for filtering
      const query = getQuery(event)
      const flightDate = query.flightDate as string | undefined
      const searchTerm = query.search as string | undefined
      
      console.log('Query params:', { flightDate, searchTerm })
      
      // Build MongoDB query for nested structure
      const filter: any = {}
      
      if (flightDate) {
        // Match the FlightDate field in nested structure
        filter['tbFlightInfo.tbBasicDetails.FlightDate'] = flightDate
      }
      
      if (searchTerm) {
        filter.$or = [
          { 'tbFlightInfo.tbBasicDetails.IATACode': { $regex: searchTerm, $options: 'i' } },
          { 'tbFlightInfo.tbBasicDetails.FlightNumber': { $regex: searchTerm, $options: 'i' } },
          { 'tbFlightInfo.tbBasicDetails.gbRoute.Origin.title': { $regex: searchTerm, $options: 'i' } },
          { 'tbFlightInfo.tbBasicDetails.gbRoute.Destination.title': { $regex: searchTerm, $options: 'i' } },
        ]
      }
      
      console.log('MongoDB filter:', JSON.stringify(filter))
      
      // Fetch flights from MongoDB
      const flights = await flightsCollection
        .find(filter)
        .sort({ 'tbFlightInfo.tbBasicDetails.FlightDate': -1, 'tbFlightInfo.tbBasicDetails.gbSchedule.StdDeptTime': 1 })
        .limit(100)
        .toArray()
      
      console.log(`Found ${flights.length} flights`)
      if (flights.length > 0) {
        console.log('Sample flight:', flights[0])
      }
      
      // Transform nested MongoDB structure to flat frontend structure
      const transformedFlights = flights.map((flight: any) => {
        const basicDetails = flight.tbFlightInfo?.tbBasicDetails
        const route = basicDetails?.gbRoute
        const schedule = basicDetails?.gbSchedule
        
        // Build route string from Origin and Destination
        const origin = route?.Origin?.title?.split('(')[0]?.trim() || 'N/A'
        const destination = route?.Destination?.title?.split('(')[0]?.trim() || 'N/A'
        const routeString = `${origin} → ${destination}`
        
        // Build flight number
        const flightNo = `${basicDetails?.IATACode || ''}${basicDetails?.FlightNumber || ''}`
        
        return {
          id: flight._id.toString(),
          flightNo: flightNo,
          route: routeString,
          departure: schedule?.StdDeptTime || 'N/A',
          aircraft: basicDetails?.ServiceType?.title || 'N/A',
          flightDate: basicDetails?.FlightDate || 'N/A',
          status: basicDetails?.Status || 'Available',
          // Include full original data for reference
          _original: flight
        }
      })
      
      console.log('Returning flights:', transformedFlights.length)
      if (transformedFlights.length > 0) {
        console.log('Sample transformed flight:', transformedFlights[0])
      }
      
      return {
        success: true,
        data: transformedFlights,
        count: transformedFlights.length,
      }
    } catch (error) {
      console.error('Error fetching flights from MongoDB:', error)
      
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
    console.error('Fatal error in flights API:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: [],
      count: 0,
    }
  }
})
