import connectDB from '@/utils/db'

export interface AuditEntityOptions {
  module: string

  entityType: string

  collectionName: string

  keyField: string

  keyValue: any

  changedBy: string

  newData: any

  excludeFields?: string[]

  organizationId?: string | null
}

function isObject(value: any) {
  return (
    value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
  )
}

function getDifferences(
  oldObj: any,
  newObj: any,
  path = '',
  excludeFields: string[] = [],
  differences: any[] = [],
) {
  const keys = new Set([
    ...Object.keys(oldObj || {}),
    ...Object.keys(newObj || {}),
  ])

  for (const key of keys) {
    const currentPath = path
      ? `${path}.${key}`
      : key

    if (
      excludeFields.includes(key)
      || excludeFields.includes(currentPath)
    ) {
      continue
    }

    const oldValue = oldObj?.[key]
    const newValue = newObj?.[key]

    if (
      isObject(oldValue)
      && isObject(newValue)
    ) {
      getDifferences(
        oldValue,
        newValue,
        currentPath,
        excludeFields,
        differences,
      )

      continue
    }

    if (
      JSON.stringify(oldValue)
      !==
      JSON.stringify(newValue)
    ) {
      differences.push({
        fieldPath: currentPath,

        oldValue,

        newValue,
      })
    }
  }

  return differences
}

export async function auditEntity(
  options: AuditEntityOptions,
) {
  try {
    const {
      module,

      entityType,

      collectionName,

      keyField,
      keyValue,

      changedBy,

      newData,

      excludeFields = [
        'updatedDate',
        'lastSavedDate',
        'version',
      ],

      organizationId = null,
    } = options


    console.log('existing', options)
    const db = await connectDB()

    const collection =
      db.collection(collectionName)

    const changeLogCollection =
      db.collection('emcChangeLog')

    const existing =
      await collection.findOne({
        [keyField]: keyValue,
      })

    if (!existing) {
      return {
        success: false,

        message:
          'Existing record not found',
      }
    }
    console.log('existing22', collectionName)
    const changes =
      getDifferences(
        existing.data ?? existing,
        newData,
        '',
        excludeFields,
      )

    if (!changes.length) {
      return {
        success: true,

        changesFound: 0,
      }
    }

    const version =
      (existing.version || 0) + 1

    const documents =
      changes.map(change => ({
        module,

        entityType,

        entityId: keyValue,

        organizationId,

        fieldPath:
          change.fieldPath,

        oldValue:
          change.oldValue,

        newValue:
          change.newValue,

        changedBy,

        changedDate:
          new Date(),

        version,
      }))

    await changeLogCollection.insertMany(
      documents,
    )

    return {
      success: true,

      changesFound:
        changes.length,
    }
  }
  catch (error: any) {
    console.error(
      'Audit failed',
      error,
    )

    return {
      success: false,

      message:
        error?.message,
    }
  }
}
