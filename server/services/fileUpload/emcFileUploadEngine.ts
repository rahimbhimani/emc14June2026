import mongoose from "mongoose"
import { emcUploadPresets } from "./emcFileUploadPresets"
// ================= UTILS =================
function getValue(obj: any, path: string) {
  if (!path) return undefined
  return path.split(".").reduce((o, k) => o?.[k], obj)
}

// ================= MAPPING =================
function applyMapping(rows: any[], config: any) {
  const mapping = config.mapping
  if (!mapping) return rows

  return rows.map((row) => {
    const mapped: any = {}

    for (const m of mapping) {

      // ✅ Case 1: Raw Excel (column exists)
      if (row[m.column] !== undefined) {
        mapped[m.field] = row[m.column]
      }

      // ✅ Case 2: Already mapped (field exists)
      else if (row[m.field] !== undefined) {
        mapped[m.field] = row[m.field]
      }

      // ❌ Not found
      else {
        mapped[m.field] = undefined

        if (m.required) {
          mapped.__errors = mapped.__errors || []
          mapped.__errors.push({
            field: m.field,
            message: `Missing column or field: ${m.column}`
          })
        }
      }
    }

    return mapped
  })
}

// ================= VALIDATION =================
async function applyValidation(rows: any[], config: any) {
  const validations = config.validation || []
  if (!validations.length) return { rows, errors: [] }

  const errors: any[] = []

  // 🔥 preload DB data (optimize later per resource)
  const dbCache: Record<string, any[]> = {}
  const db = mongoose.connection.db

  if (!db) {
    throw new Error("Database connection not ready")
  }
  for (const rule of validations) {
    if (!dbCache[rule.collection]) {
      dbCache[rule.collection] = await db.collection(rule.collection).find().toArray()
    }
  }

  rows.forEach((row, index) => {
    const rowNumber = index + 1

    for (const rule of validations) {
      const dbData = dbCache[rule.collection] || []

      const value = row[rule.field]

      // ================= dbExists =================
      if (rule.type === "dbExists") {
        const exists = dbData.some((rec: any) =>
          getValue(rec, rule.dbField) == value
        )

        if (!exists) {
          errors.push({
            row: rowNumber,
            field: rule.field,
            message: rule.message || "Value not found"
          })
        }
      }

      // ================= dbCondition =================
      if (rule.type === "dbCondition") {
        const record = dbData.find((rec: any) =>
          getValue(rec, rule.dbField) == value
        )

        if (!record) continue

        const isValid = rule.conditions.every((cond: any) => {
          const dbVal = getValue(record, cond.dbField)

          switch (cond.operator) {
            case "equals":
              return dbVal == cond.value
            case "ne":
              return dbVal != cond.value
            default:
              return false
          }
        })

        if (!isValid) {
          errors.push({
            row: rowNumber,
            field: rule.field,
            message: rule.message || "Condition failed"
          })
        }
      }
    }
  })

  return { rows, errors }
}

// ================= TRANSFORM =================
function resolveTemplate(template: string, row: any) {
  return template.replace(/{{(.*?)}}/g, (_, key) => {
    return row[key.trim()] ?? ""
  })
}

function applyTransform(rows: any[], config: any) {
  const transform = config.transform
  if (!transform) return rows

  if (transform.type === "map") {
    return rows.map((row) => {
      const obj: any = {}

      for (const field of transform.output) {

        // direct mapping
        if (field.source) {
          obj[field.field] = getValue(row, field.source)
        }

        // template
        if (field.template) {
          obj[field.field] = resolveTemplate(field.template, row)
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

  // 🔹 CLEAN INPUT (remove UI fields like __rowNumber)
  const cleanRows = rows.map(({ __rowNumber, ...rest }) => rest)

  // ================= STEP 1: MAPPING =================
  const mappedRows = applyMapping(cleanRows, config)

  // ================= STEP 2: VALIDATION =================
  const { errors } = await applyValidation(mappedRows, config)

  // 👉 If validation-only mode OR errors exist → stop here
  if (errors.length && !rows?.confirm) {
    return {
      success: false,
      errors
    }
  }

  // ================= STEP 3: TRANSFORM =================
  const transformedRows = applyTransform(mappedRows, config)

  let executionResult: any = null

  // ================= STEP 4: BACKEND EXECUTION =================
  if (mode === "BACKEND" || mode === "BOTH") {
    const fn = emcUploadPresets[preset]
    if (!fn) throw new Error("Preset not found")

    executionResult = await fn(transformedRows, user)
  }

  // ================= STEP 5: RESPONSE =================
  return {
    success: true,
    errors,
    result: {
      data: transformedRows,
      executionResult
    }
  }
}
