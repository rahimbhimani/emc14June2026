import { getReportPart } from "./emcReportPartRepository"

export async function resolveReportLayout(
  report: any,
  user: any
) {
  const orgId = user.organizationId

  const header = await getReportPart(
    report.layout?.headerId,
    orgId
  )

  const body = await getReportPart(
    report.layout?.bodyId,
    orgId
  )

  const footer = await getReportPart(
    report.layout?.footerId,
    orgId
  )

  return {
    header: header?.html || "",
    body: body?.html || "",
    footer: footer?.html || "",
    css: [
      header?.css || "",
      body?.css || "",
      footer?.css || ""
    ].join("\n")
  }
}
