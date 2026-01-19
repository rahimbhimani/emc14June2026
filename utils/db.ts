// utils/db.js
import { connect } from 'mongoose'

const connectDB = async () => {
  try {
    const l1 = await connect(useRuntimeConfig().mongodbUri)
    console.log(l1)
    const l2 = await l1.connection

    return l2

    // return (await mongoose.connect(useRuntimeConfig().mongodbUri)).connection

    // useNuxtApp.$DbConnection = mongoose.connect(useRuntimeConfig().mongodbUri)

    // const collection = mongoose.connection.collection('User')
    // const cursor = await collection.find()

    console.log('rahim connection sucess')

    // console.log(await cursor.toArray())
  }
  catch (e) {
    console.error('Error connecting to MongoDB:', e)
  }
}

export default connectDB
