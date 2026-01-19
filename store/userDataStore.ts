// stores/myStore.js
import { defineStore } from 'pinia'

export const userDataStore = defineStore('userDataStore', () => {
  const data = reactive({
    FormData: { Name: '', DataObject: {}, flattenData: [{}], UserEntryObjects: {} },
  })

  // const trial = reactive({
  //   rahim: 'rahim trial',
  // })
  function trial() {
    return data.FormData.DataObject
  }

  const fetchData = async () => {
    try {
      const response = await fetch('/api/your-endpoint') // Replace with your actual API endpoint
      const result = await response.json()

      Object.assign(data, result)
    }
    catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  function updateData(newObject) {
    debugger

    // function upsertObjectInArray(array, newObject, key) {
    // Find the index of the object with the matching key
    const index = data.FormData.flattenData.findIndex(item => item['id'] === newObject.id)

    if (index !== -1) {
      // If found, update the existing object
      data.FormData.flattenData[index] = { ...data.FormData.flattenData[index], ...newObject }
    }
    else {
      // If not found, add the new object to the array
      data.FormData.flattenData.push(newObject)
    }

    return data.FormData.flattenData
  }

  // const updateDataTBD = (id, path, value) => {
  //   debugger
  //   const lPath = `DataObject.${path}`
  //   const keys = lPath.split('.')
  //   let nested = data.FormData
  //   for (let i = 0; i < keys.length - 1; i++)
  //     nested = nested[keys[i]]
  //   nested[keys[keys.length - 1]] = value
  // }

  return { data, fetchData, updateData, trial }
})

export const userDataInternalstore = defineStore('userDataInternalstore', () => {
  const data = ({
    FormData: { Name: '', DataObject: {}, flattenData: [{}], UserEntryObjects: {} },
  })

  return { data }
})
