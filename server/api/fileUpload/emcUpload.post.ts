import {
  validateBusiness,
  validateStructure
} from "@/server/services/fileUpload/emcFileUploadValidation"
import mongoose from "mongoose"

import { executeUpload } from "@/server/services/fileUpload/emcFileUploadEngine"

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { uploadId, rows, confirm } = body

  const db = mongoose.connection.db

  const config = await db
    .collection("emcFileUploadConfigs")
    .findOne({ uploadId })

  if (!config) throw new Error("Config not found")

  // ================= MAPPING =================
  const mappedRows = rows.map((row: any) => {
    const obj: any = {}

    for (const map of config.mapping || []) {
      obj[map.field] = row[map.column]
    }

    return obj
  })

  // ================= VALIDATION =================
  const structureErrors = validateStructure(mappedRows, config)
  const businessErrors = await validateBusiness(mappedRows, config)

  const allErrors = [...structureErrors, ...businessErrors]

  if (!confirm) {
    return {
      stage: "VALIDATION",
      errors: allErrors,
      preview: mappedRows
    }
  }

  if (allErrors.length) {
    return {
      stage: "VALIDATION_FAILED",
      errors: allErrors
    }
  }

  const user = event.context.user || {}

  const result = await executeUpload(config, mappedRows, user)

  return {
    stage: "EXECUTED",
    result
  }
})
