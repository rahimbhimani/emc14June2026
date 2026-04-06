import { MongoClient, ObjectId } from 'mongodb'

const uri = 'mongodb://localhost:27017'
const client = new MongoClient(uri)

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { flightId, trolleyId } = body

    if (!flightId || !trolleyId) {
      return {
        success: false,
        error: 'Flight ID and Trolley ID are required',
      }
    }

    await client.connect()
    const db = client.db('EMC')
    const collection = db.collection('emcFlightTrolley')
    const trolleyCollection = db.collection('emcTrolley')

    // Delete the specific association
    const deleteResult = await collection.deleteOne({
      flightId,
      trolleyId,
    })

    if (deleteResult.deletedCount === 0) {
      return {
        success: false,
        error: 'Association not found',
      }
    }

    // Update trolley status back to READY
    await trolleyCollection.updateOne(
      { _id: new ObjectId(trolleyId) },
      { 
        $set: { 
          'tbTrolley.tbMain.Status': 'READY',
          'tbTrolley.tbMain.UpdatedAt': new Date()
        } 
      }
    )

    // Check if there are any remaining trolleys for this flight
    const remainingCount = await collection.countDocuments({ flightId })

    // If no trolleys remain, update flight status back to Available
    if (remainingCount === 0) {
      const flightCollection = db.collection('emcFlight')
      await flightCollection.updateOne(
        { _id: new ObjectId(flightId) },
        { $set: { 'tbFlightInfo.tbBasicDetails.Status': 'Available' } }
      )
    }

    return {
      success: true,
      data: {
        message: 'Trolley removed from flight successfully',
        remainingTrolleys: remainingCount,
      },
    }
  } catch (error) {
    console.error('Error removing flight-trolley association:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  } finally {
    await client.close()
  }
})
