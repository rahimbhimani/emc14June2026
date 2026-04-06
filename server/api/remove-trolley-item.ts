import { MongoClient, ObjectId } from 'mongodb'

const uri = 'mongodb://localhost:27017'
const client = new MongoClient(uri)

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { trolleyId, itemId } = body

    if (!trolleyId || !itemId) {
      return {
        success: false,
        error: 'Trolley ID and Item ID are required',
      }
    }

    await client.connect()
    const db = client.db('EMC')
    const collection = db.collection('emcTrolleyItem')
    const trolleyCollection = db.collection('emcTrolley')

    // Delete the specific association
    const deleteResult = await collection.deleteOne({
      trolleyId,
      itemId,
    })

    if (deleteResult.deletedCount === 0) {
      return {
        success: false,
        error: 'Association not found',
      }
    }

    // Check if there are any remaining items for this trolley
    const remainingCount = await collection.countDocuments({ trolleyId })

    // If no items remain, update trolley status back to READY
    if (remainingCount === 0) {
      await trolleyCollection.updateOne(
        { _id: new ObjectId(trolleyId) },
        { 
          $set: { 
            'tbTrolley.tbMain.Status': 'READY',
            'tbTrolley.tbMain.UpdatedAt': new Date()
          } 
        }
      )
    }

    return {
      success: true,
      data: {
        message: 'Item removed from trolley successfully',
        remainingItems: remainingCount,
      },
    }
  } catch (error) {
    console.error('Error removing trolley-item association:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  } finally {
    await client.close()
  }
})
