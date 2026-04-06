// import { emcExecuteAction } from "@/server/domain/orchestration/emcExecuteAction"

// export default defineEventHandler(async (event) => {

//   try {

//     const body = await readBody(event)

//     if (!body) {
//       throw createError({
//         statusCode: 400,
//         statusMessage: "Request body missing"
//       })
//     }

//     const {
//       organizationId,
//       containerType,
//       containerIDX,
//       actionId,
//       payload,
//       userContext
//     } = body

//     /* ======================================================
//        BASIC VALIDATION
//     ====================================================== */

//     if (!organizationId ||
//         !containerType ||
//         !containerIDX ||
//         !actionId) {

//       throw createError({
//         statusCode: 400,
//         statusMessage: "Missing required parameters"
//       })
//     }

//     if (!userContext?.userId || !userContext?.role) {
//       throw createError({
//         statusCode: 400,
//         statusMessage: "User context missing"
//       })
//     }

//     /* ======================================================
//        EXECUTE DOMAIN ACTION
//     ====================================================== */

//     const result = await emcExecuteAction({
//       organizationId,
//       containerType,
//       containerIDX,
//       actionId,
//       payload,
//       userContext
//     })

//     return {
//       success: true,
//       correlationId: result.correlationId
//     }

//   } catch (error: any) {

//     console.error("emcExecuteAction error:", error)

//     if (error.statusCode) {
//       throw error
//     }

//     throw createError({
//       statusCode: 500,x
//       statusMessage: error.message || "Internal Server Error"
//     })
//   }
// })
