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
    FormData: { Name: '', DataObject: {}, flattenData: [{}], UserEntryObjects: {}, testing: 'testing value' },
  })

  return { data }
})


export const useUserDataInternalStore = defineStore(
  'userDataInternalstoreForObjects',
  () => {
    /**
     * Creates a fresh FormData object.
     * A new object is returned every time so items do not share references.
     */
    function createDefaultFormData() {
      return {
        Name: '',
        DataObject: {},
        flattenData: [{}],
        UserEntryObjects: {},
        testing: 'testing value'
      }
    }

    const data = {
      // Default FormData for the store itself (optional)
      FormData: createDefaultFormData(),

      // All runtime objects are stored here
      Items: []
    }

    /**
     * Returns an existing item if the identifier exists.
     * If no identifier is provided, a new item is created with a UUID.
     * If the identifier does not exist, a new item is created with that identifier.
     *
     * @param {string} [identifier]
     * @returns {Object}
     *
     * Returned structure:
     * {
     *   identifier: 'uuid-or-custom-id',
     *   data: {
     *     FormData: { ... }
     *   }
     * }
     */
    function getOrCreateItem(identifier = crypto.randomUUID()) {
      // Check whether an item with this identifier already exists
      let item = data.Items.find(
        entry => entry.identifier === identifier
      )

      // Create a new item if not found
      if (!item) {
        item = {
          identifier,
          data: {
            FormData: createDefaultFormData()
          }
        }

        data.Items.push(item)
      }

      return item
    }

    return {
      data,
      getOrCreateItem
    }
  }
)
