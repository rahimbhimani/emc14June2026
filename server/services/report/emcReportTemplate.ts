function getValue(obj: any, path: string) {
  const parts = path.split(".")
  let current = obj

  for (const part of parts) {
    if (current == null) return ""
    current = current[part]
  }

  return current ?? ""
}

export function applyTemplate(
  template: string,
  row: any
) {
  return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    return getValue(row, key.trim())
  })
}

function renderDynamicTable(
  columns: any[],
  data: any[]
) {
  const visibleColumns = columns.filter(
    c => c.visible !== false
  )

  const headerHtml = visibleColumns
    .map(col => `
<th style="
  width:${col.width || "auto"};
  text-align:${col.align || "left"};
  border:1px solid #999;
  padding:6px;
  font-weight:bold;
">
        ${col.label || col.field}
      </th>
    `)
    .join("")

  const bodyHtml = data
    .map(item => {
      const row = item.row || item

      const cells = visibleColumns
        .map(col => `
<td style="
  text-align:${col.align || "left"};
  border:1px solid #ccc;
  padding:6px;
">
            ${getValue(row, col.field)}
          </td>
        `)
        .join("")

      return `<tr>${cells}</tr>`
    })
    .join("")

  return `
  <table style="
    width:100%;
    border-collapse:collapse;
    margin-top:8px;
    font-size:12px;
  ">
    <thead>
      <tr style="background:#f2f2f2;">
        ${headerHtml}
      </tr>
    </thead>

    <tbody>
      ${bodyHtml}
    </tbody>
  </table>
`
}

export function renderTemplateRows(
  template: string,
  data: any[],
  report?: any
) {
  // Dynamic column mode
  if (
    report?.columns &&
    Array.isArray(report.columns) &&
    report.columns.length > 0
  ) {
    const tableHtml = renderDynamicTable(
      report.columns,
      data
    )

    // Use first row for header fields
    const firstRow = data?.[0] || {}

    // Replace {{TABLE}} placeholder
    const merged = template.replace(
      "{{TABLE}}",
      tableHtml
    )

    return applyTemplate(merged, firstRow)
  }

  // Existing mode unchanged
  return data
    .map(row => applyTemplate(template, row))
    .join("")
} 
