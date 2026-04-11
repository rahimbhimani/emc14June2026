let memcFormDesign

export async function addemcFormDesign(vObj: any) {
  debugger

  const lemcFormDesign = new Object()

  memcFormDesign = UpdateMiscData({ ...vObj })
  // // console.log(.log('insert data screenConfigure3')
  // memcFormDesign = UpdateMiscData(memcFormDesign)
  // // // // // console.log(.log('memcFormDesign12', memcFormDesign)
  lemcFormDesign['FormParameters'] = setFormParameters()
  // // // console.log(.log('Reached addemcFormDesign', lemcFormDesign['FormParameters'])

  lemcFormDesign['ListHeaders'] = setFormListHeader()

  lemcFormDesign['FormDTObjects'] = structuredClone(memcFormDesign) //{ ...memcFormDesign }

  // // // // // console.log(.log('FormDTObjects completed1', lemcFormDesign['FormDTObjects'].board[0].Controls[0].controlProperties)

  lemcFormDesign['FormRTObjects'] = transformData(...memcFormDesign.board) // setControlsCopyFormControls()['board']

  lemcFormDesign['UserEntryObjects'] = transformControlsToObjects(memcFormDesign.board[0])
  // // console.log(.log('insert data screenConfigur5')
  // // // // // console.log(.log('FormDTObjects completed2', lemcFormDesign['FormRTObjects'].Controls[0].controlProperties)
  // // // // // // console.log(.log('FormDTObjects completed3', lemcFormDesign['FormDTObjects'].board[0].Controls[0].controlProperties)
  lemcFormDesign['FormRTSearchObjects'] = findSearchableProperties(lemcFormDesign['FormDTObjects'].board[0]) // setControlsCopyFormControls()['board']
  // // // // // // console.log(.log('FormRTSearchObjects completed3', lemcFormDesign['FormRTSearchObjects'])
  // // console.log(.log('insert data screenConfigur6')
  // lemcFormDesign['RTFormObjectForUserEntry'] = transformData(memcFormDesign.board[0])

  if (lemcFormDesign['UserEntryObjects']['$id'] === 'screenDesignStore')
    lemcFormDesign['UserEntryObjects']['$id'] = undefined

  return lemcFormDesign

  // formObj['Controls'] = board.value

  // alert(formObj)
}

function setPathAndOtherProperties(obj: any, path = ''): any[] {
  let results: any[] = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (obj[key] && typeof obj[key] === 'object') {
        // Check if 'controlProperties' exists and contains 'propertyTitle: Key'
        if (
          obj[key].controlProperties &&
          Object.values(obj[key].controlProperties).some(
            prop => prop.propertyTitle === 'Key'
          )
        ) {
          // // // // console.log(.log('ThisIsPath',` ${currentPath}`);
          obj[key] = currentPath
        }
        // Recursively search within the object
        results = results.concat(setPathAndOtherProperties(obj[key], currentPath));
      }
    }
  }

  return results;
}


function findSearchableProperties(controls: any, currentPath = ''): any {
  const searchableItems = []; // Initialize the result array
  // // // // // console.log(.log('findSearchableProperties test2', controls);

  if (controls.Controls) {
    for (const [index, control] of controls.Controls.entries()) {
      // Construct the path for the current control
      // const newPath = currentPath ? `${currentPath}.Controls[${index}]` : `Controls[${index}]`;
      const newPath = currentPath ? `${currentPath}.${control.controlProperties.find(propName => propName.propertyTitle === 'ColumnName')?.data || control.controlProperties.find(propName1 => propName1.propertyTitle === 'Name')?.data}` : `${control.controlProperties.find(propName => propName.propertyTitle === 'ColumnName')?.data || control.controlProperties.find(propName1 => propName1.propertyTitle === 'Name')?.data}`
      // // // // // console.log(.log('newPath123',newPath)

      if (control.controlProperties) {
        // // // // // console.log(.log('findSearchableProperties test3', control);

        // Filter and map properties with 'propertyTitle' === 'Searchable' and data === 'true'
        const searchableProps = control.controlProperties
          .filter(prop => prop.propertyTitle === 'Searchable' && prop.data === 'true')
          .map(() => ({
            name:
              control.controlProperties.find(propName => propName.propertyTitle === 'ColumnName')?.data || control.controlProperties.find(propName1 => propName1.propertyTitle === 'Name')?.data ||
              'NoLabel',
            DBName: newPath + (control.controlType === 'AutoComplete' || control.controlType === 'DropDown' ? '.title' : ''),
            datatype:
              (control.controlProperties.find(
                propDataType => propDataType.propertyTitle === 'Datatype'
              )?.data?.value || 'string').replace('text', 'string'),
          }));

        if (searchableProps.length > 0) {
          // // // // // console.log(.log('findSearchableProperties test4', searchableProps);
          searchableItems.push(...searchableProps)
        }
      }

      // Process nested controls if available
      if (control.Controls) {
        searchableItems.push(...findSearchableProperties(control, newPath));
      }
    }
  }

  return searchableItems;
}


function setFormDetails(vData: any) {

  vData.FormName = 'RahimFormName'
}

function transformControlsToObjects12(data) {
  // // // console.log(.log('transformControlsToObjects', data)
  if (Array.isArray(data)) {
    // Process each element in the array
    return data.map(transformControlsToObjects)
  }
  else if (typeof data === 'object' && data !== null) {
    // Create a copy of the object to avoid mutating the original
    const transformed = {}

    for (const key in data) {
      if (key === 'Controls' && Array.isArray(data[key])) {
        // Transform the Controls array to include only ControlName, id, and data
        transformed['controls'] = data[key].map(control => {
          const { ControlName, id, data } = control
          return { ControlName, id, data: data || '' }
        })
      }
      else if (key !== 'controlProperties') {
        // Recursively apply transformation for other properties
        transformed[key] = transformControlsToObjects(data[key])
      }
    }
    return transformed
  }
}


export function transformControlsToObjects(data) {
  const schema: any = {};

  // // // console.log(.log('transformControlsToObjectsCinal1234', data.Controls)
  // // console.log(.log('insert data screenConfigur4')
  data.Controls.forEach(lcontrol => {
    // // // console.log(.log('InternalControls11', lcontrol)
    const controlName = lcontrol.controlProperties.filter(e => e.propertyTitle === 'ColumnName')[0]?.data || lcontrol.controlProperties.filter(e => e.propertyTitle === 'Name')[0]?.data
    const controlSchema: any = {}
    // const controlSchema = ''

    if (lcontrol.Controls && lcontrol.Controls.length > 0) {
      // // console.log(.log('insert data screenConfigur4.2')
      schema[controlName] = transformControlsToObjects(lcontrol);
      // // console.log(.log('insert data screenConfigur4.3')
    } else {
      // // console.log(.log('insert data screenConfigur4.4')
      schema[controlName] = SetDefaultValues(lcontrol, controlSchema);
      // // console.log(.log('insert data screenConfigur4.5')
    }

    // if (lcontrol.Controls && lcontrol.Controls.length > 0) {
    //   // // // console.log(.log('InternalControls33')
    //   const nested = transformControlsToObjects(lcontrol)

    //   Object.assign(controlSchema, nested)
    // }
    // // // // console.log(.log('InternalControls22', controlSchema)
    // schema[controlName] = controlSchema;
  })
  // // // console.log(.log('transformControlsToObjectsFinal', schema)
  // // console.log(.log('insert data screenConfigur4.6')
  return schema;
}

function SetDefaultValues(vcontrol, vcontrolSchema) {
  let lReturnValue
  // // // console.log(.log('SetDefaultValues', vcontrol)
  // // // console.log(.log('SetDefaultValues', vcontrol.controlProperties.filter(e=>e.propertyTitle === 'Mandatory'))
  if (vcontrol === undefined)
    return

  // // console.log(.log('SetDefaultValues333', vcontrol)
  // Set default values based on control type
  if (vcontrol.controlType === 'TextBox') {
    let lTemp
    // // console.log(.log('SetDefaultValues0.1', lTemp)
    lTemp = vcontrol.controlProperties.filter(e => e.propertyTitle === 'Mandatory')
    // // console.log(.log('SetDefaultValues0', lTemp)
    if (lTemp.length === 0) {
      // // console.log(.log('SetDefaultValues1')
      lReturnValue = ''
    }
    else if (lTemp.length > 0) {
      if (lTemp[0].data.value === 'true') {
        // // console.log(.log('SetDefaultValue2')
        lReturnValue = undefined
      }
      else {
        // // console.log(.log('SetDefaultValues3')
        lReturnValue = ''
      }
    }
  }
  else if (vcontrol.controlType === 'CheckBox')
    lReturnValue = false
  else if (vcontrol.controlType === 'DropDown' || vcontrol.controlType === 'AutoComplete')
    lReturnValue = null
  else if (vcontrol.controlType === 'NoControl')
    lReturnValue = null

  // // console.log(.log('SetDefaultValues123', lReturnValue)
  return lReturnValue

}

function setFormParameters() {
  // // // // // console.log(.log('inside setFormParameters',memcFormDesign.board,'inside setFormParameters111',memcFormDesign)
  memcFormDesign.FormParameters = new Object()
  memcFormDesign.FormParameters['Name'] = memcFormDesign.board[0].ControlName
  memcFormDesign.FormParameters.Title = memcFormDesign.board[0].controlProperties.filter(e => e.propertyTitle === 'Title')[0].data || ''
  memcFormDesign.FormParameters.Description = memcFormDesign.board[0].controlProperties.filter(e => e.propertyTitle === 'Description')[0].data || ''
  memcFormDesign.FormParameters.Mandatory = memcFormDesign.board[0].controlProperties.filter(e => e.propertyTitle === 'MandatoryStyle')[0].data || ''
  memcFormDesign.FormParameters.ColorForMandatory = memcFormDesign.board[0].controlProperties.filter(e => e.propertyTitle === 'ColorForMandatory')[0].data || ''
  memcFormDesign.FormParameters.FormType = memcFormDesign.board[0].controlProperties.filter(e => e.propertyTitle === 'FormType')[0].data || ''
  // // // console.log(.log('inside setFormParameters2', memcFormDesign.FormParameters)

  return memcFormDesign.FormParameters
}

function CreateRuntimeForGrid(input) {
  //create Headers { title: 'Plant', align: 'start', sortable: false, key: 'name' }
  //Create rows
  // // // console.log(.log('this is control name on 26', input)
  const header = input.Controls.map((individualControl, index) => ({
    title: individualControl.controlProperties.filter(e => e.propertyTitle === 'Label')[0].data,
    align: 'start',
    key: individualControl.controlProperties.filter(e => e.propertyTitle === 'ColumnName')[0].data
  }));
  // header.push({ title: 'Actions', key: 'actions', align: 'end', sortable: false })
  // // // console.log(.log('people',header);
  console.log('BeforesetFormListHeader')
  console.log('setFormListHeader90987')

  input['headers'] = setFormListHeader(input)
}

function setFormListHeader(vdataForGrid = undefined) {
  try {
    debugger
    const lObjListHeader = []
    let lItemsForList = []
    // console.log('setFormListHeader1')
    // lVarr = findControlsByType(memcFormDesign, 'TextBox')
    lItemsForList = findAllParentObjectsByFilter(vdataForGrid === undefined ? memcFormDesign?.board[0].Controls : vdataForGrid?.Controls, { ObjectName: 'ListHeader' })
    console.log('setFormListHeader1.1', lItemsForList)
    // // // // console.log(.log('lItemsForList12399', memcFormDesign?.board[0].Controls)
    // console.log('larrItemsForListHeader123887',lItemsForList)
    lItemsForList.forEach(item => {
      console.log('setFormListHeader1.2')
      const larrItemsForListHeader = findObjectsByCriteria(item.controlProperties, { ObjectName: 'ListHeader' })

      console.log('setFormListHeader1.3', item.controlType)

      if (findObjectsByCriteria(item.controlProperties, { propertyTitle: 'show in List', data: 'true' }).length > 0 || vdataForGrid !== undefined) {
        const lObj = {}
        console.log('setFormListHeader1.4')
        // console.log('thisis item', item.controlType, item.controlProperties.filter(e=>e.propertyTitle === 'Multiselect')[0]?.data === 'true')
        if ((item.controlType === 'DropDown' && item.controlProperties.filter(e => e.propertyTitle === 'Multiselect')[0]?.data === 'true')) {
          lObj['value'] = 'showFormattedvalueOnlist(' + item.dataPath + ')'
        }

        console.log('setFormListHeader4')
        const lItem = item.controlType ? item.controlType : ''
        larrItemsForListHeader.forEach(controlPropertyitem => {
          console.log('991009098', controlPropertyitem['data'], vdataForGrid?.dataPath)
          // lObj[controlPropertyitem['ObjectItemCode']] = controlPropertyitem['data'] + controlPropertyitem.propertyTitle === 'Key' ? 'AutoComplete' : '.title'
          lObj[controlPropertyitem['ObjectItemCode']] = controlPropertyitem['data'] + (controlPropertyitem.propertyTitle === 'Key' ? lItem === 'AutoComplete' || lItem === 'DropDown' ? '.title' : '' : '')
          // lobj['value'] = 'showFormattedvalueonlist()'
          console.log('InsideItemsForListheader1233331', lObj[controlPropertyitem['ObjectItemCode']])
        },
        )

        if (Object.keys(lObj).length > 0) {
          if (vdataForGrid !== undefined)
            lObj['key'] = lObj.key.replace((vdataForGrid.dataPath).replace('FormName.', '') + '.', '')
          lObjListHeader.push(lObj)
          console.log('setFormListHeader5223', lObj)
        }
      }
      // // // // console.log(.log(larrItemsForListHeader)
    })
    // // // // console.log(.log('returnFormListHeader',lObjListHeader)
    return lObjListHeader
  } catch (error) {
    console.error('Error in setFormListHeader:', error);
  }

}

function setControlsCopyFormControls() {
  // keepThisPropertyAtRuntime
  debugger

  return filterControlProperties(memcFormDesign.board[0])
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

function findAllParentObjectsByFilter(obj, filter) {
  const parents = []

  function objectMatchesFilter(target, filter) {
    return Object.keys(filter).every(key => target[key] === filter[key])
  }

  function recursiveSearch(currentObj, currentParent) {
    if (Array.isArray(currentObj)) {
      for (let i = 0; i < currentObj.length; i++) {
        if (currentObj[i] && objectMatchesFilter(currentObj[i], filter)) {
          if (!parents.includes(currentParent))
            parents.push(currentParent) // Add distinct parent
        }
        else {
          console.log('currentParent', currentObj[i].controlType)
          recursiveSearch(currentObj[i], currentObj) // Continue searching
        }
      }
    }
    else if (typeof currentObj === 'object' && currentObj !== null) {
      if (objectMatchesFilter(currentObj, filter)) {
        if (!parents.includes(currentParent))
          parents.push(currentParent) // Add distinct parent
      }
      for (const key in currentObj) {
        if (currentObj[key] && typeof currentObj[key] === 'object')
          recursiveSearch(currentObj[key], currentObj) // Continue searching
      }
    }
  }

  recursiveSearch(obj, null)

  return parents
}

function findObjectsByCriteria(obj, criteria) {
  const results = []

  // Check if an object matches all properties in the criteria
  function matchesCriteria(item) {
    return Object.keys(criteria).every(key => item[key] === criteria[key])
  }

  function recursiveSearch(obj) {
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (obj[i] && matchesCriteria(obj[i]))
          results.push(obj[i]) // Add matching object to results
        else
          recursiveSearch(obj[i]) // Search deeper
      }
    }
    else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (obj[key] && matchesCriteria(obj[key]))
          results.push(obj[key]) // Add matching object to results
        else
          recursiveSearch(obj[key]) // Search deeper
      }
    }
  }

  recursiveSearch(obj)

  return results
}

function setByString(input, str) {
  // // // // console.log(.log('key extracted123', str)
  const [path, value] = str.split(':').map(part => part.trim());
  const keys = path.split('.');

  let current = input;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      // // // // console.log(.log('key extracted',value)
      current[key] = value;
    } else {
      if (!current[key]) current[key] = {};
      current = current[key];
    }
  });
}

function transformData05Apr2025(input, parentPath = 'FormName') {
  // Create the current data path for the object

  const currentPath = parentPath ? input.controlType === 'Form' ? parentPath : `${parentPath}.${input.ControlName}` : input.ControlName
  // // // // console.log(.log('parent path', parentPath, 'controlname', input)
  // Attach dataPath only at the parent level
  if (input.ControlName)
    input.dataPath = currentPath

  // Filter `controlProperties` for objects where `keepThisPropertyAtRuntime` is "true"
  if (Array.isArray(input.controlProperties)) {
    const larrControlProps = input.controlProperties
      .filter(property => {
        return (
          property.keepThisPropertyAtRuntime === 'true'
          && ((typeof property.data === 'object' && Object.entries(property.data).length > 0)
            || (typeof property.data !== 'object' && property.data !== ''))
        )
      })
      .map(property => {
        const filteredProperty = {
          name: property.propertyTitle, // Use `propertyTitle` as `name`
          data: property.data || '', // Retain `data`
        }

        // Include `rules` only if it contains data
        // if (property.rules && property.rules.length > 0)
        //   filteredProperty.rules = property.rules

        if (property.hasOwnProperty('vbindOutPutAttribute') && property.data !== '') {
          if (!input.vbind)
            input.vbind = {}
          input.vbind[property.vbindOutPutAttribute] = {
            data: property.data,
          }
        }

        return filteredProperty
      })

    if (larrControlProps.length > 0)
      input.controlProperties = (larrControlProps)

    else
      delete input.controlProperties
  }

  // Recursively process nested `Controls`
  if (Array.isArray(input.Controls)) {
    input.Controls = input.Controls.map(childControl =>
      transformData(childControl, currentPath),
    )
  }

  return input
}

function transformData(Vinput, parentPath = null) {
  let input = JSON.parse(JSON.stringify(Vinput))
  console.log('transfordata start90909012')
  // // // // console.log(.log('transfordata start1234',JSON.stringify(Vinput))
  let currentPath

  if (input.controlProperties.filter(e => e.propertyTitle === 'ColumnName').length > 0) {
    // // // // // console.log(.log('testing787999',input.controlProperties.filter(e => e.propertyTitle === 'ColumnName'))
    currentPath = parentPath ? `${parentPath}.${input.controlProperties.find(propName => propName.propertyTitle === 'ColumnName')?.data || input.controlProperties.find(propName1 => propName1.propertyTitle === 'Name')?.data}` : 'FormName'
    console.log('testing7871', currentPath)
    input.dataPath = currentPath
  }
  else {
    //control.controlProperties.find(propName => propName.propertyTitle === 'ColumnName')?.data || control.controlProperties.find(propName1 => propName1.propertyTitle === 'Name')?.data}
    currentPath = parentPath ? `${parentPath}.${input.controlProperties.find(propName => propName.propertyTitle === 'ColumnName')?.data || input.controlProperties.find(propName1 => propName1.propertyTitle === 'Name')?.data}` : 'FormName'
    if (input.ControlName)
      console.log('testing7872', currentPath)
    input.dataPath = currentPath
    // // // // // console.log(.log('testing78712',currentPath)
  }

  // Filter `controlProperties` for objects where `keepThisPropertyAtRuntime` is "true"
  // // // // console.log(.log('90911sdfsdf9', input.controlProperties)
  if (Array.isArray(input.controlProperties)) {
    if (input.controlProperties) {
      const larrControlPropsKey = input.controlProperties
        .filter(property1 => {
          return (
            property1.propertyTitle === 'Key'
          )
        })
      if (larrControlPropsKey?.length > 0) {
        // // // // console.log(.log('camehere', currentPath, 'Cameheretitle',larrControlPropsKey[0].propertyTitle)
      }
    }

    const larrControlProps = input.controlProperties
      .filter(property => {
        return (
          ((property.keepThisPropertyAtRuntime === 'true')
            && ((typeof property.data === 'object' && Object.entries(property.data).length > 0)
              || (typeof property.data !== 'object' && property.data !== '')) || property.hasOwnProperty('vbindEvenIfEmptyData'))
        )
      })
      .map(property => {
        const filteredProperty = {
          propertyTitle: property.propertyTitle, // Use `propertyTitle` as `name`
          data: property.data || '', // Retain `data`
        }

        if (property.hasOwnProperty('vbindOutPutAttribute')) {
          if (!input.vbind)
            input.vbind = {}

          if (property.hasOwnProperty('vbindEvenIfEmptyData'))
            // // // // console.log(.log('here it is vbindEvenIfEmptyData', property)

            if (property.data) {
              // input.vbind[property.vbindOutPutAttribute] = {
              //   // // // // // console.log(.log('camehere22', currentPath, 'Cameheretitle22',larrControlPropsKey[0].propertyTitle)
              //   data: property.data,
              // }
              // // // // console.log(.log('will poopulate before', property.data)
              // input.vbind[property.vbindOutPutAttribute] = property.data

              property.vbindOutPutAttribute.includes(".") ? setByString(input.vbind, property.vbindOutPutAttribute + ' : ' + property.data) : input.vbind[property.vbindOutPutAttribute] = property.data
            }
            else {
              if (property.hasOwnProperty('vbindEvenIfEmptyData')) {
                // // // // console.log(.log('will poopulate', property.vbindEvenIfEmptyData)
                // input.vbind[property.vbindOutPutAttribute] = property.vbindEvenIfEmptyData
                // input.vbind[property.vbindEvenIfEmptyData] = 'red '
                // setByString(input, "vbind.style.background-color", "green");
                property.vbindEvenIfEmptyData.includes(".") ? setByString(input.vbind, property.vbindEvenIfEmptyData) : input.vbind = property.vbindEvenIfEmptyData

                // input.vbind['style'] = {'style.background-color' : 'yellow'}//[property.vbindEvenIfEmptyData] = 'red '
              }
            }
        }
        // // // // console.log(.log('before rules found',property)
        if (property['propertyTitle'] === 'Rules') {
          if (!input.vbind)
            input.vbind = {}
          // // // // console.log(.log('within rules found1',property.vbindOutPutAttribute)
          input.vbind[property.vbindOutPutAttribute ? property.vbindOutPutAttribute : 'rules'] = setRulesData(property.data)
          // // // // console.log(.log('Property vbindOutputattribute', input.vbind)
          // // // // console.log(.log('within rules found2',property)
          // property.data = setRulesData(property.data)

        }

        return filteredProperty
      })

    if (larrControlProps.length > 0) {
      // // // // console.log(.log('This is my property 9900',larrControlProps)
      input.controlProperties = (larrControlProps)
    }
    else {
      // // // // console.log(.log('camehereToDelete')
      delete input.controlProperties
    }
  }

  // console.log('this is control name on 24', input.controlType)
  if (input.controlType === 'GridTable') {
    console.log('this is control name on 999', input)
    CreateRuntimeForGrid(input)
  }
  // Recursively process nested `Controls`
  if (Array.isArray(input.Controls)) {
    input.Controls = input.Controls.map(childControl =>
      transformData(childControl, currentPath),
    )
  }
  return input
}

const setRulesData = (rules) => {
  return rules.map(rule => ({
    rule: rule.Name,
    fn: `(value) => ${rule.RuleText} || '${rule.RuleFailureMessage}'`
  }));
};



function UpdateMiscData(input, parentPath = '') {
  // let input = JSON.parse(JSON.stringify(Vinput))
  debugger
  // // // // console.log(.log('StartedreturnMiscInfo')
  let currentPath

  if (input.controlProperties?.filter(e => e.propertyTitle === 'ColumnName').length > 0) {
    currentPath = parentPath ? `${parentPath}.${input.controlProperties.find(propName => propName.propertyTitle === 'ColumnName')?.data || input.controlProperties.find(propName1 => propName1.propertyTitle === 'Name')?.data}` : 'FormName'
    console.log('testing7873', parentPath, currentPath)
    input.dataPath = currentPath
  }
  else {
    currentPath = parentPath ? `${parentPath}.${input.controlProperties.find(propName => propName.propertyTitle === 'ColumnName')?.data || input.controlProperties.find(propName1 => propName1.propertyTitle === 'Name')?.data}` : 'FormName'
    if (input.ControlName)
      console.log('testing7875', currentPath)
    input.dataPath = currentPath
  }
  // // // // console.log(.log('CurrentPath13', currentPath)
  // Filter `controlProperties` for objects where `keepThisPropertyAtRuntime` is "true"
  if (Array.isArray(input.controlProperties)) {
    // // // // console.log(.log('insidearray')
    if (input.controlProperties) {
      const larrControlPropsKey = input.controlProperties
        .filter(property1 => {
          return (
            property1.propertyTitle === 'Key'
          )
        })
      if (larrControlPropsKey?.length > 0) {
        // // // // console.log(.log('camehere990', currentPath, larrControlPropsKey[0],larrControlPropsKey[0].propertyTitle)
        larrControlPropsKey[0].data = currentPath.replace('FormName.', '')
      }
    }
  }

  if (Array.isArray(input.board)) {
    input.board[0].Controls = input.board[0].Controls.map(childControl =>
      UpdateMiscData(childControl, currentPath),
    )
  }

  // Recursively process nested `Controls`
  if (Array.isArray(input.Controls)) {
    input.Controls = input.Controls.map(childControl =>
      UpdateMiscData(childControl, currentPath),
    )
  }
  // // // // // console.log(.log('returnMiscInfo',input)
  return input
}


function filterControlProperties(obj, parentPath = '') {
  debugger
  const result = Array.isArray(obj) ? [] : {} // Create an array or object based on input type
  let lcntrl = ''
  if (obj.Controls)
    lcntrl = obj.controlProperties ? obj.controlProperties.filter(e => e.propertyTitle === 'Name').length > 0 ? obj.controlProperties.filter(e => e.propertyTitle === 'Name')[0].data : obj.ControlName : obj.ControlName
  else
    lcntrl = obj.controlProperties ? obj.controlProperties.filter(e => e.propertyTitle === 'Table Name').length > 0 ? obj.controlProperties.filter(e => e.propertyTitle === 'Table Name')[0].data : obj.ControlName : obj.ControlName
  let currentPath
  if (lcntrl !== undefined)
    currentPath = parentPath ? `${parentPath}.${lcntrl}` : lcntrl

  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (key === 'controlProperties') {
        const filteredProperties = obj[key]
          .filter(property => {
            return (
              property.keepThisPropertyAtRuntime === 'true'
              && ((typeof property.data === 'object' && Object.entries(property.data).length > 0)
                || (typeof property.data !== 'object' && property.data !== ''))
            )
          })
          .map(property => ({
            propertyTitle: property.propertyTitle,
            data: property.data,
          }))

        if (filteredProperties.length > 0)
          result[key] = filteredProperties

        obj[key]?.forEach(property => {
          if (property.hasOwnProperty('vbindOutPutAttribute') && property.data !== '') {
            if (!result.vbind)
              result.vbind = {}
            result.vbind[property.vbindOutPutAttribute] = {
              data: property.data,

            }
          }
        })
      }
      else {
        // Recursively filter nested objects with updated path
        const nestedResult = filterControlProperties(obj[key], `${currentPath}`)
        if (Object.keys(nestedResult).length > 0)
          result[key] = nestedResult
      }
    }
    else {
      // obj['dataPath'] = `${currentPath}`
      result[key] = obj[key] // Copy the value if it's not an object
      // Add path here
    }
  }

  return result // Return the filtered object
}

function filterControlPropertiesTBD(obj) {
  const result = Array.isArray(obj) ? [] : {} // Create an array or object based on input type

  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Check for controlProperties specifically
      if (key === 'controlProperties') {
        const filteredProperties = obj[key]
          .filter(property => {
            // Ensure data is not empty or an empty string
            return (
              (property.keepThisPropertyAtRuntime === 'true' && (
                (typeof property.data === 'object' && Object.entries(property.data).length > 0)
                || (typeof property.data !== 'object' && property.data !== '')
              )))
          })
          .map(property => {
            // Select only the desired fields
            return {
              propertyTitle: property.propertyTitle,
              data: property.data,
            }
          })

        if (filteredProperties.length > 0)
          result[key] = filteredProperties

        debugger
        obj[key]?.forEach(property => {
          if (property.hasOwnProperty('vbindOutPutAttribute') && property.data !== '') {
            if (result.vbind === undefined)
              result.vbind = {}
            result.vbind[property.vbindOutPutAttribute] = property.data
          }
        })
      }
      else {
        // Recursively filter nested objects
        const nestedResult = filterControlProperties(obj[key])
        if (Object.keys(nestedResult).length > 0)
          result[key] = nestedResult // Only add if there are properties
      }
    }
    else {
      result[key] = obj[key] // Copy the value if it's not an object
    }
  }

  return result // Return the filtered object
}
