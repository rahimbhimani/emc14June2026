import connectDB from "../../../utils/db"

export async function resolveBCLData(params: any) {
  const { flightNumber, date } = params

  const db = await connectDB()

  const result = await db.collection("emcContainers").aggregate([
    {
      $match: {
        type: "TROLLEY",
        "flight.number": flightNumber,
        "flight.date": date
      }
    },

    {
      $lookup: {
        from: "emcContainerSeal",
        localField: "_id",
        foreignField: "containerId",
        as: "seals"
      }
    },

    {
      $lookup: {
        from: "emcCargo",
        localField: "_id",
        foreignField: "containerId",
        as: "cargo"
      }
    },

    {
      $addFields: {
        compliance: {
          $arrayElemAt: ["$lifecycle.compliance", -1]
        }
      }
    },

    {
      $addFields: {
        totalWeight: { $sum: "$cargo.weight" },
        totalPieces: { $sum: "$cargo.pieces" }
      }
    }
  ]).toArray()

  return result
}
