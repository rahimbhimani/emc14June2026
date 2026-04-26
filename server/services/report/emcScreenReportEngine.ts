import mongoose from "mongoose"

function emcGetValue(
  obj: any,
  path: string
) {
  const parts = path.split(".")
  let current = obj

  for (const part of parts) {
    if (current == null) return ""
    current = current[part]
  }

  return current ?? ""
}

function emcBuildHtmlTable(
  columns: any[],
  rows: any[]
) {
  const header = `
    <tr>
      ${columns.map(col => `
        <th style="
          width:${col.width}%;
          text-align:left;
        ">
          ${col.label}
        </th>
      `).join("")}
    </tr>
  `

  const body = rows.map(row => `
    <tr>
      ${columns.map(col => `
        <td>
          ${emcGetValue(row, col.field)}
        </td>
      `).join("")}
    </tr>
  `).join("")

  return `
    <table>
      <thead>${header}</thead>
      <tbody>${body}</tbody>
    </table>
  `
}

export async function emcRunScreenReport(
  payload: any,
  user: any
) {
  const db = mongoose.connection.db

  const screen = await db
    .collection("emcForms")
    .findOne({
      "FormParameters.Name":
        payload.screenId
    })

  if (!screen) {
    throw new Error(
      "Screen config not found"
    )
  }

  const columns = (
    payload.selectedColumns?.length
      ? screen.ListHeaders.filter(
        (x: any) =>
          payload.selectedColumns.includes(
            x.key
          )
      )
      : screen.ListHeaders
  ).map((x: any) => ({
    label: x.title,
    field: x.key,
    width: Number(x.width || 10)
  }))

  const rows = await db
    .collection(payload.screenId)
    .find({
      organizationId:
        user.organizationId
    })
    .limit(1000)
    .toArray()

  const html = `
    <html>
      <head>
        <style>
          body{
            font-family:Arial;
            padding:20px;
            font-size:12px;
            color:#000;
          }

          h1{
            margin:0 0 12px;
            font-size:20px;
          }

          .meta{
            margin-bottom:12px;
            color:#555;
          }

          table{
            width:100%;
            border-collapse:collapse;
          }

          th{
            background:#f2f2f2;
            border:1px solid #999;
            padding:6px;
          }

          td{
            border:1px solid #ccc;
            padding:6px;
          }
        </style>
      </head>

      <body>
        <h1>
          ${screen.FormParameters.Title}
        </h1>

        <div class="meta">
          Generated:
          ${new Date().toLocaleString()}
        </div>

        ${emcBuildHtmlTable(
    columns,
    rows
  )}
      </body>
    </html>
  `

  await db.collection(
    "emcReportAudit"
  ).insertOne({
    screenId: payload.screenId,
    userId: user.id,
    organizationId:
      user.organizationId,
    format:
      payload.format || "HTML",
    rowCount: rows.length,
    createdAt: new Date()
  })

  return html
}
