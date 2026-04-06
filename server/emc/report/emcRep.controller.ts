import { defineEventHandler, getQuery, send } from "h3"
import {
  getReportExcel,
  getReportHTML
} from "./emcRep.service"

export default defineEventHandler(async (event) => {
  const { reportId, format } = event.context.params as any
  const query = getQuery(event)

  if (format === "pdf") {
    // const pdf = await getReportPDF(reportId, query)
    // event.node.res.setHeader("Content-Type", "application/pdf")
    // return send(event, pdf)
    throw new Error("PDF disabled temporarily")
  }

  if (format === "excel") {
    const excel = await getReportExcel(reportId, query)
    event.node.res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    return send(event, excel)
  }

  const result = await getReportHTML(reportId, query)
  return result.html
})

// export default defineEventHandler(async () => {
//   return "STEP 1 OK"
// })
