import { resolveBCLData } from "./emcRep.dataResolver"
import { getReportConfig } from "./emcRep.model"
import { renderTemplate } from "./emcRep.templateEngine"

export async function generateReport(reportId: string, params: any) {
  const config = await getReportConfig(reportId)

  if (!config) throw new Error("Report not found")

  let data: any = []

  if (config.dataSource.resolver === "resolveBCLData") {
    data = await resolveBCLData(params)
  }

  const html = renderTemplate(config.template, {
    meta: params,
    data
  })

  return { html, data }
}
