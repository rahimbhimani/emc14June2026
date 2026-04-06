import mongoose from "mongoose"

export const emcUploadPresets: Record<string, Function> = {

  async CREW_FLIGHT_MAPPING(rows: any[], user: any) {
    const db = mongoose.connection.db

    for (const row of rows) {
      await db.collection("emcFlight").updateOne(
        {
          "tbFlightInfo.tbBasicDetails.FlightNumber": row.flightNumber
        },
        {
          $addToSet: {
            crew: {
              crewId: row.crewId,
              crewName: row.crewName
            }
          }
        }
      )
    }

    return { success: true }
  }

}
