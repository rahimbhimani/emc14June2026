import { MongoClient } from 'mongodb'

export default defineEventHandler(async (event) => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
  
  console.log('Testing MongoDB connection...')
  console.log('URI:', mongoUri)
  
  let client: MongoClient | null = null

  try {
    client = new MongoClient(mongoUri)
    await client.connect()
    
    console.log('✅ MongoDB connected successfully')
    
    const database = client.db('db')
    const collections = await database.listCollections().toArray()
    
    console.log('Available collections:', collections.map(c => c.name))
    
    const flightsCollection = database.collection('emcFlight')
    const count = await flightsCollection.countDocuments()
    
    console.log(`Flight documents count: ${count}`)
    
    // Get one sample document
    const sample = await flightsCollection.findOne({})
    console.log('Sample flight:', JSON.stringify(sample, null, 2))
    
    return {
      success: true,
      message: 'MongoDB connection successful',
      database: 'db',
      collection: 'emcFlight',
      documentCount: count,
      collections: collections.map(c => c.name),
      sampleDocument: sample
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }
  } finally {
    if (client) {
      await client.close()
    }
  }
})
