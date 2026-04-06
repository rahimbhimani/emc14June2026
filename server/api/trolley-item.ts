import { MongoClient, ObjectId } from 'mongodb'

const uri = 'mongodb://localhost:27017'
const client = new MongoClient(uri)

export default defineEventHandler(async (event) => {
  const method = event.method

  try {
    await client.connect()
    const db = client.db('EMC')
    const collection = db.collection('emcTrolleyItem')

    // GET: Retrieve items for a specific trolley
    if (method === 'GET') {
      const query = getQuery(event)
      const { trolleyId } = query

      if (!trolleyId) {
        return {
          success: false,
          error: 'Trolley ID is required',
        }
      }

      const associations = await collection.find({ trolleyId: trolleyId as string }).toArray()
      const itemIds = associations.map(a => a.itemId)

      return {
        success: true,
        data: {
          itemIds,
          items: associations.map(a => ({
            itemId: a.itemId,
            quantity: a.quantity || 1,
          })),
        },
      }
    }

    // POST: Save trolley-item associations
    if (method === 'POST') {
      const body = await readBody(event)
      const { trolleyId, items } = body

      if (!trolleyId || !items || !Array.isArray(items)) {
        return {
          success: false,
          error: 'Trolley ID and items array are required',
        }
      }

      const trolleyCollection = db.collection('emcTrolley')

      // Delete existing associations for this trolley
      await collection.deleteMany({ trolleyId })

      // Insert new associations
      if (items.length > 0) {
        const trolleyItemDocs = items.map(item => ({
          trolleyId,
          itemId: item.itemId,
          quantity: item.quantity || 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))

        await collection.insertMany(trolleyItemDocs)

        // Update trolley status to "Under Planning" if it has items
        await trolleyCollection.updateOne(
          { _id: new ObjectId(trolleyId) },
          { 
            $set: { 
              'tbTrolley.tbMain.Status': 'Under Planning',
              'tbTrolley.tbMain.UpdatedAt': new Date()
            } 
          }
        )
      } else {
        // If no items, set trolley back to READY
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
          message: 'Trolley items saved successfully',
          itemCount: items.length,
        },
      }
    }

    return {
      success: false,
      error: 'Method not supported',
    }
  } catch (error) {
    console.error('Error in trolley-item API:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  } finally {
    await client.close()
  }
})
