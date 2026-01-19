import { defineStore } from 'pinia'
import { v4 as uuid } from 'uuid'
import boardData from '../static/data/controlproperties.json'

export const useScreenDesignStore = defineStore('screenDesignStore', () => {
  // const refAllcontrols = useStorage('screenDesignStore', boardData);
  const formObj = reactive({ type: 'ForDatabase' })
  const board = ref([])

  /**
   * Tasks
   */
  const getTask = computed(() => {
    return taskId => {
      for (const column of board.value.columns) {
        const task = column.tasks.find(task => task.id === taskId)
        if (task)
          return task
      }
    }
  })

  function returnData() {
    // return board

    return formObj
  }

  function findControlsByType(data, controlType, result = []) {
    for (const item of data) {
      // Check if the current item matches the desired controlType
      if (item.controlType === controlType && item['ControlName'] !== undefined)
        result.push(item)

      // Recursively check for any nested arrays within the current item
      for (const key in item) {
        if (Array.isArray(item[key]))
          findControlsByType(item[key], controlType, result)
      }
    }

    return result
  }

  function saveForm(vObj) {
    debugger

    // formObj = {}

    formObj['FormParameters'] = setFormParameters(vObj)

    formObj['ListHeaders'] = setFormListHeader()

    formObj['FormEntryControls'] = setControlsCopyFormControls(board.value)

    formObj['RunTimeControls'] = setControlsCopyFormControls(board.value)

    // formObj['Controls'] = board.value

    // alert(formObj)
  }

  function setControlsCopyFormControls(obj, filterFn) {
    if (Array.isArray(obj)) {
      return obj.map(item => setControlsCopyFormControls(item))
    }
    else if (typeof obj === 'object' && obj !== null) {
      const newObj = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key) && key !== 'controlProperties') {
          // Skip 'controlProperties'

          newObj[key !== 'TabControls' ? key : 'Tabs'] = setControlsCopyFormControls(obj[key])
        }
      }

      return newObj
    }
    else {
      return obj // Return primitives as is
    }
  }

  function setFormListHeader() {
    debugger
    const mObjListHeader = []
    let lVarr = []

    lVarr = findControlsByType(board.value, 'TextBox')

    lVarr.forEach(item => {
      let arrObj = []
      console.log('ListHeaderShowList',item.controlProperties[item.controlProperties.findIndex(e => e.propertyTitle === 'show in List')].data)
      if ((item.controlProperties[item.controlProperties.findIndex(e => e.propertyTitle === 'show in List')].data) === true) {
        // alert('rahim')
        const lObj = Object.assign({})

        arrObj = item.controlProperties.filter(e => e.ObjectName === 'ListHeader')
        arrObj.forEach(indivHeader => {
          lObj[indivHeader.ObjectItemCode] = indivHeader.data
        })
        lObj['InternalOrderSequence'] = item.controlProperties[item.controlProperties.findIndex(e => e.propertyTitle === 'Column Sequence')].data
        console.log('this is headers', lObj)
        mObjListHeader.push(lObj)

        // alert(item.controlProperties[item.controlProperties.findIndex(e => e.propertyTitle === 'Column Size')].data)
      }
    })

    return mObjListHeader
  }

  function setFormParameters(vObj) {
    return {
      master: vObj.formname,
      DatabaseTable: vObj.database,
    }
  }

  function addForm() {
    debugger
    let lControl = Object.assign({}, boardData.controls.find(e => e.controlType == 'Form'))
    lControl.id = uuid()
    lControl.Controls = []
    lControl = setDefaultToData(lControl)
    SetControlName(lControl)
    board.value.push({ ...lControl })
  }

  function updateElementsWithId(obj, targetKey, targetValue, newVal, vItem, parent = null) {
    debugger
    obj.find(item => {
      // console.log(item)
      if (item != undefined && item[targetKey] === targetValue) {
        // --
        item.controlProperties = item.controlProperties.map(lobj => {
          if (lobj.propertyTitle === vItem.propertyTitle) {
            debugger
            const lBoolForMandatory = false
            if (lobj.vbindOutPutAttribute) {
              if (item.vbind !== undefined) {
                if (lobj.vbindOutPutAttribute.includes('.') === false) {
                  item.vbind[lobj.vbindOutPutAttribute] = (typeof newVal === 'object' ? newVal.value : newVal)
                }
                else {
                  // const keys = lobj.vbindOutPutAttribute.split('.')
                  // if (item.vbind === undefined) {
                  //   item.vbind = keys.reduceRight((acc, key) => { // Iterate from right to left
                  //     return { [key]: acc } // Build the nested object
                  //   }, (typeof newVal === 'object' ? newVal.value : newVal))
                  // }
                  // else {
                  const keys = (`vbind.${lobj.vbindOutPutAttribute}`).split('.') // Split the path by dots
                  const lastKey = keys.pop() // Extract the last key (the property to update)

                  // Traverse the object and create missing properties as needed
                  const target = keys.reduce((acc, key) => {
                    if (!acc[key])
                      acc[key] = {} // Create the object if it doesn't exist

                    return acc[key]
                  }, item)

                  // Update the nested property with the new value
                  target[lastKey] = (typeof newVal === 'object' ? newVal.value : newVal)

                  // }
                }
              }
              else {
                debugger
                const vObj = {}

                console.log(lobj.vbindOutPutAttribute, '1')

                // "{ style: { 'background-color': 'red' }, label: 'we' }"
                if (lobj.vbindOutPutAttribute.includes('.')) {
                  // style.background=red
                  console.log(lobj.vbindOutPutAttribute, 'inside', '2')

                  const larr = lobj.vbindOutPutAttribute.split('.')

                  // vObj.add(larr.reduceRight((acc, key) => ({ [key]: acc }), 'value'))
                  item.vbind = larr.reduceRight((acc, key) => ({ [key]: acc }), (typeof newVal === 'object' ? newVal.value : newVal))
                  console.log(lobj.vbindOutPutAttribute, 'post', '3', item)
                }
                else {
                  vObj[lobj.vbindOutPutAttribute] = (typeof newVal === 'object' ? newVal.value : newVal)
                  item.vbind = vObj
                }
              }
            }
            if (lobj.addElementToObject)
              item[lobj.addElementToObject] = (typeof newVal === 'object' ? newVal.value : newVal)

            if (vItem.propertyTitle === 'Name')
              item.ControlName = newVal

            return { ...lobj, data: newVal, ChangedBy: 'user' }

            // return
          }
          else {
            return { ...lobj }
          }
        })

        // --
        return

        // return true; // Found the object
      }
      else if (typeof item === 'object' && item !== null) {
        return updateElementsWithId(Object.values(item), targetKey, targetValue, newVal, vItem) // Recursively search deeper
      }

      return false
    })

    // If the element and value are not found, return null
    return null
  }

  function addControl(vArrayOfParents, vControlToAd, vGroupObjectName, vAddToProperties = '') {
    debugger
    if (board === undefined || board.value.length === 0)
      addForm()
    let lObjToAddTo = board.value[board.value.findIndex(e => e.controlType == 'Form')]

    vArrayOfParents.forEach(vParent => {
      Object.keys(vParent).forEach(vElement => {
        lObjToAddTo = lObjToAddTo[vElement].find(e => e.id == vParent[vElement])
      })
    })

    lObjToAddTo[vGroupObjectName] == undefined ? lObjToAddTo[vGroupObjectName] = [addObject(vControlToAd, vAddToProperties)] : lObjToAddTo[vGroupObjectName].push(addObject(vControlToAd, vAddToProperties))
  }

  function findControlById(obj, targetId) {
    // If the current object has an id property that matches the targetId, return it
    if (obj && obj.id === targetId)
      return obj

    // Iterate over all properties of the object
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key]

        // If the value is an object or array, recursively search inside it
        if (typeof value === 'object' && value !== null) {
          const found = findControlById(value, targetId)
          if (found)
            return found
        }
      }
    }

    // Return null if the target id is not found in the current object
    return null
  }

  function addGenericControl(vArrayOfParents, vControlToAd, vGroupObjectName, vAddToProperties = '') {
    debugger
    if (board === undefined || board.value.length === 0)
      addForm()

    let lObjToAddTo = board.value[board.value.findIndex(e => e.controlType === 'Form')]

    // Sample usage
    if (vArrayOfParents !== '')
      lObjToAddTo = findControlById(board.value, vArrayOfParents)

    console.log(lObjToAddTo)

    lObjToAddTo[vGroupObjectName] === undefined ? lObjToAddTo[vGroupObjectName] = [addObject(vControlToAd, vAddToProperties)] : lObjToAddTo[vGroupObjectName].push(addObject(vControlToAd, vAddToProperties))
  }

  function findObjWithIDAndReplaceTheObject(obj, targetId, newObject) {
    // alert(targetId)
    debugger
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (obj[i]?.id === targetId) {
          newObject['IsFormvalid'] = true
          obj[i] = { ...newObject }

          // alert(i)
          obj[i].id = targetId

          return true
        }
        else if (findObjWithIDAndReplaceTheObject(obj[i], targetId, newObject)) {
          return true
        }
      }
    }
    else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        console.log('objRahim', obj, 'keyRahim', key)
        if (obj[key]?.id === targetId) {
          obj[key] = { ...newObject }

          obj[key].id = targetId
          obj[key]['IsFormvalid'] = true

          // alert(key)

          return true
        }
        else if (findObjWithIDAndReplaceTheObject(obj[key], targetId, newObject)) {
          return true
        }
      }
    }

    return false
  }

  function getObjectFromTemplate(vObjectName) {
    let lObj = boardData.controls.find(e => e.controlType === vObjectName)
    console.log('rahim bhimani is here gg', lObj.controlProperties.filter(e => e.dataType === 'Array'))

    lObj.controlProperties.filter(e => e.dataType === 'Array').forEach(lelem => { 
      lelem.data = JSON.parse(JSON.stringify([])) 
      lelem.Defaultvalue = JSON.parse(JSON.stringify([])) })
    // const newArray = ruleManagement.map(obj => JSON.parse(JSON.stringify(obj)));
  //   lObj
  //   .filter(lArray => lArray.dataType === 'Array') // Filters rules with value > 10
  //   .forEach(lelem => {
  //     lelem.data = []
  // })

  return lObj

  }

  function updateControl(vArrayOfParents, vControlToAd, vGroupObjectName, vAddToProperties = '') {
    debugger

    // alert('rahim')
    console.log('updateControlBefore130425')
    
    let lControlToAdd = getObjectFromTemplate(vControlToAd)
    
    console.log('IControl909', lControlToAdd)
    console.log('vAddToProperties', vAddToProperties)
    
    if (vControlToAd === 'Component')
      lControlToAdd['ComponentDetails'] = vAddToProperties

    const lobj = findObjWithIDAndReplaceTheObject(board.value, vArrayOfParents, lControlToAdd)

    console.log('updateControl130425', lobj)

    // const lObjToAddTo = board.value[board.value.findIndex(e => e.controlType === 'Form')]

    // board.value[board.value.findIndex(e=>e.controlType=='Form')]['TabControls'].find(e=>e.id=='c32f4195-f6b2-4ab4-bbd1-ec10d0507f1b')

    // if (vArrayOfParents.length == 3) {
    //   var lTab, lGroup, lControl

    //   lTab = lObjToAddTo.TabControls.findIndex(e => e.id == vArrayOfParents[0].TabControls)
    //   lGroup = board.value[board.value.findIndex(e => e.controlType == 'Form')].TabControls[lTab].GroupBoxes.findIndex(f => f.id == vArrayOfParents[1].GroupBoxes)
    //   lControl = board.value[board.value.findIndex(e => e.controlType == 'Form')].TabControls[lTab].GroupBoxes[lGroup].Controls.findIndex(e => e.id == vArrayOfParents[2].Controls)

    //   lObjToAddTo = addObject(vControlToAd, vAddToProperties)
    //   board.value[board.value.findIndex(e => e.controlType == 'Form')].TabControls[lTab].GroupBoxes[lGroup].Controls[lControl] = lObjToAddTo
    // }
    // if (vArrayOfParents.length == 4) {
    //   var lTab, lGroup, lControl, lControlSecond

    //   lTab = lObjToAddTo.TabControls.findIndex(e => e.id == vArrayOfParents[0].TabControls)
    //   lGroup = board.value[board.value.findIndex(e => e.controlType == 'Form')].TabControls[lTab].GroupBoxes.findIndex(f => f.id == vArrayOfParents[1].GroupBoxes)
    //   lControl = board.value[board.value.findIndex(e => e.controlType == 'Form')].TabControls[lTab].GroupBoxes[lGroup].Controls.findIndex(e => e.id == vArrayOfParents[2].Controls)
    //   lControlSecond = board.value[board.value.findIndex(e => e.controlType == 'Form')].TabControls[lTab].GroupBoxes[lGroup].Controls[lControl].Controls.findIndex(e => e.id == vArrayOfParents[3].Controls)
    //   lObjToAddTo = addObject(vControlToAd, vAddToProperties)
    //   board.value[board.value.findIndex(e => e.controlType == 'Form')].TabControls[lTab].GroupBoxes[lGroup].Controls[lControl].Controls[lControlSecond] = lObjToAddTo
    // }
  }

  function mergeObjects(vID){
    debugger
    const originalObject = findObjectById(board, vID)
    const newObject = getObjectFromTemplate(originalObject.controlType)
    const mergedObject = mergeObjectsInternal(originalObject, newObject)

    // const mergedObject = mergeObjectsInternal(originalObject, newObject)
    replaceObjectById(board.value, vID, mergedObject)
    return mergedObject
  }
  function replaceObjectById(data, id, newObject) {
    function searchAndReplace(data) {
      // If the input data is an array
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          if (typeof data[i] === "object" && data[i].id === id) {
            data[i] = newObject; // Replace the object
            return true; // Indicate that replacement was done
          }
          if (searchAndReplace(data[i])) return true; // Recurse
        }
      }
      // If the input data is an object
      else if (typeof data === "object" && data !== null) {
        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            if (typeof data[key] === "object" && data[key]?.id === id) {
              data[key] = newObject; // Replace the object
              return true; // Indicate that replacement was done
            }
            if (searchAndReplace(data[key])) return true; // Recurse
          }
        }
      }
      return false; // If no match found
    }
  
    // Trigger the search and replacement
    return searchAndReplace(data);
  }

  function mergeObjectsInternal(originalObject, newObject) {
  
    Object.keys(newObject).forEach(key => {
      if (key === "controlProperties") {
        // Handle the merging of controlProperties array
        const newProperties = newObject.controlProperties || []
        let originalProperties = originalObject.controlProperties || []
        
        // Map original properties by their propertyTitle for quick lookup
        const originalMap = new Map(
          originalProperties.map(prop => [prop.propertyTitle, prop])
        )
        // Iterate over new properties
        newProperties.forEach(newProp => {
          if (originalMap.has(newProp.propertyTitle)) {
            // Merge existing property
            // Object.assign(originalMap.get(newProp.propertyTitle), newProp);
          } else {
            // Add new property if not found
            originalProperties.push(newProp);
          }
        })
        originalProperties = originalProperties.filter(obj =>
          newProperties.some(ref => ref.propertyTitle === obj.propertyTitle))

        originalObject.controlProperties = originalProperties;
      } else {
        // Merge or add other root-level properties
        originalObject[key] = newObject[key];
      }
    })
    return originalObject
  }

  // function mergeObjectsInternal(originalObject, newObject) {
  //   // Merge root-level properties

  //   debugger
  //   Object.keys(newObject).forEach(key => {
  //     if (key === "controlProperties") {
  //       // Handle merging of controlProperties array
  //       const originalProperties = originalObject.controlProperties || [];
  //       const newProperties = newObject.controlProperties || [];
  
  //       // Create a Map from newProperties for quick lookup by propertyTitle
  //       const newMap = new Map(newProperties.map(prop => [prop.propertyTitle, prop]));
  
  //       // Filter originalProperties to include only those present in newProperties
  //       const mergedProperties = originalProperties
  //         .filter(originalProp => newMap.has(originalProp.propertyTitle))
  //         .map(originalProp => {
  //           const newProp = newMap.get(originalProp.propertyTitle);
  //           return {
  //             ...newProp, // Include new properties
  //             ...originalProp, // Original takes precedence where necessary
  //             data: originalProp.data || newProp.data, // Original `data` prevails if present
  //           };
  //         });
  
  //       // Add any new properties from newProperties not already in originalProperties
  //       newProperties.forEach(newProp => {
  //         if (!mergedProperties.some(prop => prop.propertyTitle === newProp.propertyTitle)) {
  //           mergedProperties.push(newProp);
  //         }
  //       });
  
  //       // Update originalObject's controlProperties
  //       originalObject.controlProperties = mergedProperties;
  
  //     } else {
  //       // Merge or add other root-level properties
  //       originalObject[key] = newObject[key];
  //     }
  //   });
  
  //   return originalObject;
  // }


  function findObjectById(data, id) {
    function search(data) {
      // If the input data is an array, iterate through it
      if (Array.isArray(data)) {
        for (const item of data) {
          const result = search(item);
          if (result) return result;
        }
      }
      // If the input data is an object
      else if (typeof data === "object" && data !== null) {
        if (data.id === id) return data; // Return the matching object if `id` matches
        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            const result = search(data[key]);
            if (result) return result;
          }
        }
      }
      return null; // If no match is found
    }
  
    // Search for the object with the matching id
    return search(data);
  }

  function deleteElementById(data, idToDelete) {
    // Check if current element matches the target ID
    debugger
    console.log('targetId', idToDelete)
    console.log('data', data)

    // Check if the current object matches the target ID
    if (data.id === idToDelete)
      return null // Return null to delete the element

    // Traverse through all keys to find nested arrays and objects
    for (const key in data) {
      if (Array.isArray(data[key]) && key !== 'controlProperties') {
      // If the key is an array, map over it and recursively apply the function
        data[key] = data[key]
          .map(child => deleteElementById(child, idToDelete))
          .filter(child => child !== null) // Remove null (deleted) elements
      }
      else if (typeof data[key] === 'object' && data[key] !== null && key !== 'controlProperties') {
      // If the key is an object, apply recursion to that object
        data[key] = deleteElementById(data[key], idToDelete)
      }
    }

    return data // Return the modified data
  }

  function deleteControl(targetId, dataToDeleteFromvControlToAd, vGroupObjectName) {
    // Check if current element matches the target ID

    // console.log(deleteElementById(board.value, targetId))
    if (vGroupObjectName === 'Form')

      board.value = []

    // Object.assign(board.value, [])
    else
      board.value = deleteElementById(board.value, targetId)
  }

  function deleteControl22Sep2024(vArrayOfParents, vControlToAd, vGroupObjectName) {
    debugger
    const lObjToAddTo = board.value[board.value.findIndex(e => e.controlType == 'Form')]

    if (vArrayOfParents.length == 3) {
      var lTab, lGroup, lControl
      lTab = lObjToAddTo.TabControls.findIndex(e => e.id == vArrayOfParents[0].TabControls)
      lGroup = board.value[board.value.findIndex(e => e.controlType == 'Form')].TabControls[lTab].GroupBoxes.findIndex(f => f.id == vArrayOfParents[1].GroupBoxes)
      lControl = board.value[board.value.findIndex(e => e.controlType == 'Form')].TabControls[lTab].GroupBoxes[lGroup].Controls.findIndex(e => e.id == vArrayOfParents[2].Controls)
      board.value[board.value.findIndex(e => e.controlType == 'Form')].TabControls[lTab].GroupBoxes[lGroup].Controls.splice(lControl, 1)
    }

    else if (vArrayOfParents.length == 2) {
      var lTab, lGroup
      lTab = lObjToAddTo.TabControls.findIndex(e => e.id == vArrayOfParents[0].TabControls)
      lGroup = board.value[board.value.findIndex(e => e.controlType == 'Form')].TabControls[lTab].GroupBoxes.findIndex(f => f.id == vArrayOfParents[1].GroupBoxes)
      board.value[board.value.findIndex(e => e.controlType == 'Form')].TabControls[lTab].GroupBoxes.splice(lGroup, 1)
    }
    else if (vArrayOfParents.length == 1) {
      var lTab
      lTab = lObjToAddTo.TabControls.findIndex(e => e.id == vArrayOfParents[0].TabControls)
      board.value[board.value.findIndex(e => e.controlType == 'Form')].TabControls.splice(lTab, 1)
    }
    else if (vArrayOfParents.length == 4) {
      var lTab, lGroup, lControl, lControlSecond

      lTab = lObjToAddTo.TabControls.findIndex(e => e.id == vArrayOfParents[0].TabControls)
      lGroup = board.value[board.value.findIndex(e => e.controlType == 'Form')].TabControls[lTab].GroupBoxes.findIndex(f => f.id == vArrayOfParents[1].GroupBoxes)
      lControl = board.value[board.value.findIndex(e => e.controlType == 'Form')].TabControls[lTab].GroupBoxes[lGroup].Controls.findIndex(e => e.id == vArrayOfParents[2].Controls)
      lControlSecond = board.value[board.value.findIndex(e => e.controlType == 'Form')].TabControls[lTab].GroupBoxes[lGroup].Controls[lControl].Controls.findIndex(e => e.id == vArrayOfParents[3].Controls)
      board.value[board.value.findIndex(e => e.controlType == 'Form')].TabControls[lTab].GroupBoxes[lGroup].Controls[lControl].Controls.splice(lControlSecond, 1)
    }
  }

  function addObject(vObjectName, vAddToProperties = '') {
    let lControlToAdd = boardData.controls.find(e => e.controlType === vObjectName)

    // alert(vObjectName)
    lControlToAdd.id = uuid()
    lControlToAdd = deepCopy(setDefaultToData(lControlToAdd))

    if (vAddToProperties !== '') {
      let lControl = boardData.controls.find(e => e.controlType == vAddToProperties)
      lControl = deepCopy(setDefaultToData(lControl))
      lControl.controlProperties.forEach((element, index) => {
        lControlToAdd.controlProperties.push(element)
      })
    }
    debugger
    SetControlName(lControlToAdd)
    lControlToAdd['IsFormvalid'] = true

    return { ...lControlToAdd }
  }

  function updateObject(vObjectIdToUpdate){
    

  }

  function SetControlName(vControlToAd) {
    debugger
    let lcontrolName
    let lCount
    const lObj = findObjectsWithElement(board.value, [{ controlType: vControlToAd.controlType }])

    lCount = lObj.length
    lCount = lCount - 1

    let lReturnArray = []
    do {
      lCount = lCount + 1
      lcontrolName = (vControlToAd.controlType.concat(lCount.toString())).padStart(3, '0')
      lReturnArray = findObjectsWithElement(board.value, [{ Name: lcontrolName }])
      if (lCount > 200)
        break
    } while (lReturnArray.length !== 0)

    vControlToAd.controlProperties.find(e => e.propertyTitle == 'Name') !== undefined ? vControlToAd.controlProperties.find(e => e.propertyTitle == 'Name').data = lcontrolName : ''
  }

  function deepCopy(obj) {
    if (Array.isArray(obj)) {
      // If obj is an array, create a new array and recursively deep copy each element
      return obj.map(item => deepCopy(item))
    }
    else if (typeof obj === 'object' && obj !== null) {
      // If obj is an object, create a new object and recursively deep copy each property
      const copy = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key))
          copy[key] = deepCopy(obj[key])
      }

      return copy
    }
    else {
      // If obj is neither an array nor an object, return the value as is (primitive type)
      return obj
    }
  }

  function setDefaultToData(vControlToAdd) {
    debugger
    vControlToAdd.controlProperties.forEach(element => {
      if (element.Defaultvalue != '')
        element.data = element.Defaultvalue; element.ChangedBy = 'system'
    })

    return vControlToAdd
  }

  function addTabControl() {
    debugger
    if (board === undefined || board.value.length === 0)
      addForm()
    let lControlToAdd = Object.assign({}, boardData.controls.find(e => e.controlType === 'Tab'))
    lControlToAdd.id = uuid()
    lControlToAdd = deepCopy(setDefaultToData(lControlToAdd))
    SetControlName(lControlToAdd)
    board.value[board.value.findIndex(e => e.controlType == 'Form')].TabControls.push({ ...lControlToAdd })
  }

  function addTask({ columnIndex, taskName }) {
    board.value.columns[columnIndex].tasks.push({
      id: uuid(),
      name: taskName,
      description: '',
    })
  }

  function deleteTask(taskId) {
    for (const column of board.value.columns) {
      const taskIndex = column.tasks.findIndex(task => task.id === taskId)

      if (taskIndex !== -1) {
        column.tasks.splice(taskIndex, 1)

        return
      }
    }
  }

  function moveTask({
    fromTaskIndex,
    toTaskIndex,
    fromColumnIndex,
    toColumnIndex,
  }) {
    const task = board.value.columns[fromColumnIndex].tasks.splice(
      fromTaskIndex,
      1,
    )[0]

    board.value.columns[toColumnIndex].tasks.splice(toTaskIndex, 0, task)
  }

  /**
   * Columns
   */
  function addColumn(columnName) {
    board.value.columns.push({
      name: columnName,
      tasks: [],
    })
  }

  function clearScreen() {
    debugger
    const lObjToAddTo = board.value.findIndex(e => e.controlType == 'Form')

    do {
      board.value[lObjToAddTo].TabControls.forEach(element => {
        deleteControl([{ TabControls: element.id }], 'Tabs', 'Tabs')
      })
    }
    while (board.value[lObjToAddTo].TabControls.length > 0)

    board.value.splice(0, 1)
  }

  function findObjectsWithElement(data, vElement, results = []) {
  // debugger
    if (Array.isArray(data)) {
      // If data is an array, recursively search through each object in the array
      data.forEach(item => findObjectsWithElement(item, vElement, results))
    }
    else if (typeof data === 'object') {
      let lbool = true
      vElement.forEach(lelement => {
        if (data[Object.keys(lelement)] !== lelement[Object.keys(lelement)]) {
          // If it matches, add it to the results array
          lbool = false
        }
      })
      if (lbool == true)
        results.push(data)

      // If data is an object, check if it has the desired properties

      // Recursively search through the object's properties
      for (const key in data) {
        // debugger
        key !== 'controlProperties' ? findObjectsWithElement(data[key], vElement, results) : ''
      }
    }

    return results
  }

  function findObjectsWithParents(data, targetId, parents = []) {
    let found = false

    function search(data, targetId, parents) {
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          search(data[i], targetId, [...parents])
          if (found)
            return // Exit the inner function if the target is found
        }
      }
      else if (typeof data === 'object') {
        if (data.id && data.id === targetId) {
          console.log(`Object with ID ${targetId}:`)
          let lIsDataObjAdded = false
          parents.forEach(parent => {
            console.log(` - ${parent.ControlName || parent.controlType || 'Unknown'}`)
            if (lIsDataObjAdded == false) { lLineage.value.push(data); lIsDataObjAdded = true }
            lLineage.value.push(parent)
          })
          console.log(` - ${data.ControlName || data.controlType || 'Unknown'}`)
          console.log(data)
          found = true // Set found to true to exit the outer function
          // Exit the inner function if the target is found
        }
        else {
          for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
              const value = data[key]
              if (typeof value === 'object' || Array.isArray(value)) {
                search(value, targetId, [...parents, data])
                if (found)
                  return // Exit the inner function if the target is found
              }
            }
          }
        }
      }
    }
    search(data, targetId, parents)
  }
  var lLineage = ref([])
  function HighLightControl(vId) {
    debugger
    lLineage = ref([])
    findObjectsWithParents(board.value, vId)

    return lLineage
  }

  function getLineage() {
    return lLineage.value
  }

  function deleteColumn(columnIndex) {
    board.value.columns.splice(columnIndex, 1)
  }

  function moveColumn({ fromColumnIndex, toColumnIndex }) {
    const column = board.value.columns.splice(fromColumnIndex, 1)[0]

    board.value.columns.splice(toColumnIndex, 0, column)
  }

  return {
    /* State */
    board,

    /* Getters */
    getTask,

    /* Actions */
    addColumn,
    addGenericControl,
    addTask,
    deleteColumn,
    deleteTask,
    moveColumn,
    moveTask,
    addForm,
    addTabControl,
    addControl,
    updateControl,
    updateElementsWithId,
    clearScreen,
    deleteControl,
    HighLightControl,
    findObjectsWithElement,
    getLineage,
    saveForm,
    returnData,
    mergeObjects,
  }
})
