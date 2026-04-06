import mongoose from "mongoose"

// ================= NORMALIZE =================
function normalizeValue(value: any) {
  if (value === null || value === undefined) return value
  if (typeof value === "string") return value.trim()
  return value
}

function getValueFromPath(obj: any, path: string) {
  if (!path) return undefined

  const parts = path.split(".")
  let current = obj

  for (const part of parts) {
    if (!current) return undefined
    current = current[part]
  }

  return current
}

function getValue(row: any, field: string) {
  return normalizeValue(row[field])
}

function extractValue(obj: any, path: string) {
  const parts = path.split(".")
  let current = obj

  for (const part of parts) {
    if (Array.isArray(current)) current = current[0]
    if (!current) return undefined
    current = current[part]
  }

  return normalizeValue(current)
}

// ================= STRUCTURE =================
export function validateStructure(rows: any[], config: any) {
  const errors: any[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    for (const map of config.mapping || []) {
      let value = normalizeValue(row[map.field])

      if (map.required && (value === "" || value === undefined)) {
        errors.push({
          row: i + 1,
          field: map.field,
          message: "Required"
        })
        continue
      }

      if (value === undefined || value === "") continue

      if (map.type === "string") {
        row[map.field] = String(value).trim()
      }

      if (map.type === "number") {
        const num = Number(value)
        if (isNaN(num)) {
          errors.push({
            row: i + 1,
            field: map.field,
            message: "Must be a number"
          })
        } else {
          row[map.field] = num
        }
      }

      if (map.pattern) {
        const regex = new RegExp(map.pattern)
        if (!regex.test(value)) {
          errors.push({
            row: i + 1,
            field: map.field,
            message: "Invalid format"
          })
        }
      }
    }
  }

  return errors
}

// ================= BUSINESS =================
export async function validateBusiness(rows: any[], config: any) {
  const errors: any[] = []
  const db = mongoose.connection.db

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    for (const rule of config.validation || []) {

      // ================= DB EXISTS =================
      if (rule.type === "dbExists") {
        const value = getValue(row, rule.field)
        if (!value) continue

        const dbField = rule.dbField || rule.field

        const exists = await db.collection(rule.collection)
          .findOne({ [dbField]: value })

        if (!exists) {
          errors.push({
            row: i + 1,
            field: rule.field,
            message: "Not Found"
          })
        }
      }

      // ================= DB CONDITION (NEW) =================
      if (rule.type === "dbCondition") {
        const value = getValue(row, rule.field)
        if (!value) continue

        const dbField = rule.dbField || rule.field

        const record = await db.collection(rule.collection)
          .findOne({ [dbField]: value })

        if (!record) continue

        for (const cond of rule.conditions || []) {
          const dbVal = getValueFromPath(record, cond.dbField)

          let valid = false

          if (cond.operator === "equals") {
            valid = String(dbVal).toUpperCase() === String(cond.value).toUpperCase()
          }

          if (!valid) {
            errors.push({
              row: i + 1,
              field: rule.field,
              message: rule.message || "Condition failed"
            })
          }
        }
      }

      // ================= CROSS FIELD =================
      if (rule.type === "crossFieldMatch") {
        const source = getValue(row, rule.sourceField)
        const compare = getValue(row, rule.compareWith)

        if (!source) continue

        const record = await db.collection(rule.collection)
          .findOne({ [rule.sourceField]: source })

        if (!record) {
          errors.push({
            row: i + 1,
            field: rule.sourceField,
            message: "Not Found"
          })

          if (compare) {
            errors.push({
              row: i + 1,
              field: rule.compareWith,
              message: "Mismatch"
            })
          }

          continue
        }

        if (record[rule.targetField] !== compare) {
          errors.push({
            row: i + 1,
            field: rule.compareWith,
            message: "Mismatch"
          })
        }
      }
    }
  }

  return errors
}
