import connectDB from '@/utils/db'
import { getDifferences } from './emcObjectDiff'

export async function saveChangeLog({
  module,

  entityType,
  entityId,

  organizationId = null,

  changedBy,

  oldData,
  newData,

  version = 1,
}: any) {
  try {
    const changes =
      getDifferences(
        oldData,
        newData,
      )

    if (!changes.length) {
      return {
        success: true,

        changesFound: 0,
      }
    }

    const db = await connectDB()

    await db
      .collection('emcChangeLog')
      .insertOne({
        module,

        entityType,
        entityId,

        organizationId,

        version,

        changedBy,

        changedDate:
          new Date(),

        changes,
      })

    return {
      success: true,

      changesFound:
        changes.length,
    }
  }
  catch (error) {
    console.error(
      'saveChangeLog failed',
      error,
    )

    return {
      success: false,

      changesFound: 0,
    }
  }
}
