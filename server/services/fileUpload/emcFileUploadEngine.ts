import { emcUploadPresets } from "./emcFileUploadPresets"

// ================= TRANSFORM =================
function applyTransform(rows: any[], config: any) {
  const transform = config.transform
  if (!transform) return rows

  if (transform.type === "map") {
    return rows.map(row => {
      const obj: any = {}

      for (const field of transform.output) {

        // direct mapping
        if (field.source) {
          obj[field.field] = row[field.source]
        }

        // template
        if (field.template) {
          obj[field.field] = field.template.replace(
            /{{(.*?)}}/g,
            (_, key) => row[key.trim()] || ""
          )
        }
      }

      return obj
    })
  }

  return rows
}

// ================= EXECUTION =================
export async function executeUpload(config: any, rows: any[], user: any) {
  const mode = config.execution?.mode || "BACKEND"
  const preset = config.execution?.preset

  let result: any = {}

  // 🔥 APPLY TRANSFORM BEFORE RETURN
  const transformedRows = applyTransform(rows, config)

  if (mode === "BACKEND" || mode === "BOTH") {
    const fn = emcUploadPresets[preset]
    if (!fn) throw new Error("Preset not found")

    result.executionResult = await fn(transformedRows, user)
  }

  if (mode === "RETURN" || mode === "BOTH") {
    result.data = transformedRows
  }

  return result
}
