import mongoose from "mongoose"

export const emcReportHandlers = {
  async GET_BCL_DATA(params: any, user: any) {
    const db = mongoose.connection.db

    return await db.collection("containers").aggregate([
      {
        $match: {
          _id: params.containerId,
          organizationId: user.organizationId
        }
      },
      {
        $lookup: {
          from: "flights",
          localField: "currentState.flightId",
          foreignField: "_id",
          as: "flight"
        }
      },
      { $unwind: "$flight" }
    ]).toArray()
  }
}
