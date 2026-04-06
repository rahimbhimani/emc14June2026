import { generateReport } from "./emcRep.engine"

export async function getReportHTML(reportId: string, params: any) {
  return await generateReport(reportId, params)
}

// export async function getReportPDF(reportId: string, params: any) {
//   const { html } = await generateReport(reportId, params)
//   return await exportPDF(html)
// }

// export async function getReportExcel(reportId: string, params: any) {
//   const { data } = await generateReport(reportId, params)
//   return exportExcel(data)
// }

// export async function getReportHTML(reportId: string, params: any) {
//   return "HTML DISABLED"
// }

export async function getReportPDF(reportId: string, params: any) {
  return "PDF DISABLED"
}

export async function getReportExcel(reportId: string, params: any) {
  return "EXCEL DISABLED"
}
