import { promises as fs } from 'fs'
import {
  createError,
  defineEventHandler,
  getRouterParam,
  setHeader,
} from 'h3'
import mime from 'mime-types'
import path from 'path'

export default defineEventHandler(async (event) => {
  const rawFilename = getRouterParam(event, 'filename')

  if (!rawFilename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Filename missing',
    })
  }

  // 🔒 VERY IMPORTANT
  // Remove any path info like "items/abc.jpg" or "../abc.jpg"
  const filename = path.basename(rawFilename)

  // ✅ SINGLE uploads folder (no subfolders)
  const filePath = path.join(
    process.cwd(),
    'public',
    'uploads',
    filename
  )

  try {
    const buffer = await fs.readFile(filePath)

    setHeader(
      event,
      'Content-Type',
      mime.lookup(filename) || 'application/octet-stream'
    )
    setHeader(event, 'Cache-Control', 'public, max-age=86400')

    return buffer
  } catch {
    throw createError({
      statusCode: 404,
      statusMessage: 'Image not found',
    })
  }
})
