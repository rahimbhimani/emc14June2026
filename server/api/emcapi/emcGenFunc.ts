import connectDB from '@/utils/db'

export default defineEventHandler(async event => {
  console.log('function started')

  const { Master: vMaster } = await readBody(event)

  // console.log(event)
  console.log(vMaster)

  const cn = await connectDB()
  const collection = cn.collection(vMaster)
  const cursor = collection.find()

  return await cursor.toArray()
})
