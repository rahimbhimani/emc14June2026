import mongoose from "mongoose"

export default defineEventHandler(
  async (event) => {

    const {
      organizationId
    } = await readBody(event)

    if (!organizationId) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "organizationId is required"
      })
    }

    const db =
      mongoose.connection.db

    /* ==========================================
       Return broad audit dataset.
       Filtering/relevance happens in
       emcContainerHistory.vue
       Existing frontend logic preserved.
    ========================================== */

    const logs = await db
      .collection("emcAuditLogs")
      .find({
        organizationId
      })
      .sort({
        timestamp: -1
      })
      .limit(500)
      .toArray()

    return {
      success: true,
      logs
    }
  }
)
