export interface ChangeRecord {
  fieldPath: string
  oldValue: any
  newValue: any
}

function isObject(value: any) {
  return (
    value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
  )
}

export function getDifferences(
  oldObj: any,
  newObj: any,
  path = '',
  differences: ChangeRecord[] = [],
): ChangeRecord[] {
  const keys = new Set([
    ...Object.keys(oldObj || {}),
    ...Object.keys(newObj || {}),
  ])

  for (const key of keys) {
    const currentPath = path
      ? `${path}.${key}`
      : key

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
        fieldPath:
          currentPath,

        oldValue,

        newValue,
      })
    }
  }

  return differences
}
