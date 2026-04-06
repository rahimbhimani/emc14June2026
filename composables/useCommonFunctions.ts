import { userDataInternalstore } from '@/store/userDataStore'

// const muserDataStore = userDataStore()
const muserDataInternalstore = userDataInternalstore()

export function useUpdateObject99(obj, path) {

  //debugger
  let lobj = obj
  console.log('useUpdateObject', lobj)
  const getObjectData = () =>
    path.split('.').reduce((o, key) => (o ? o[key] : undefined), lobj)

  const setObjectData = value => {
    const keys = path.split('.')
    const lastKey = keys.pop()
    const nested = keys.reduce((o, key) => (o[key] = o[key] || {}), lobj)
    console.log('nested', nested, 'nested values', value)
    nested[lastKey] = value
  }

  const dataValue = computed({
    get: getObjectData,
    set: setObjectData,
  })
  console.log('return value', dataValue)
  return { dataValue }
}


export function useUpdateObject(obj, groupObject, rowIndex = null) {
  //debugger
  let path = groupObject.value.dataPath
  if (groupObject.value.ComponentInfo) {
    // alert(groupObject.value.ComponentInfo)
    const dotIndex = groupObject?.value.dataPath?.lastIndexOf(".")
    groupObject.value.dataPath =
      dotIndex !== -1
        ? groupObject.value.dataPath.slice(0, dotIndex + 1) + groupObject?.value.ComponentInfo + "." + groupObject.value.dataPath.slice(dotIndex + 1)
        : groupObject.value.dataPath

    path = groupObject.value.dataPath
  }


  const getObjectData = () =>
    path.split('.').reduce((o, key) => (o ? o[key] : undefined), obj)

  const setObjectData = (value) => {
    const keys = path.split('.')
    const lastKey = keys.pop()

    let nested = obj
    for (const key of keys) {
      if (!nested[key] || typeof nested[key] !== 'object') {
        nested[key] = {}
      }
      nested = nested[key]
    }

    nested[lastKey] = value
  }

  const dataValue = computed({
    get: getObjectData,
    set: setObjectData,
  })

  return { dataValue }
}

export function useGetObjectByPath(obj, path) {
  return path.split('.').reduce((acc, key) => acc && acc[key], obj);
}


// function nestedModel(path) {
//   return computed({
//     get: () => getObjectData(muserDataStore.formData.UserEntryObjects, path),
//     set: value => setObjectData(muserDataStore.formData.UserEntryObjects, path, value),
//   })
// }
