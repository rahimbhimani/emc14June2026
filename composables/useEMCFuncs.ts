import { v4 as uuid } from 'uuid'

export async function useEmcList(vMaster: string, vInputData?: object, vRetreiveConfData: boolean = false) {
  console.log('useEmcList started')

  console.log((vInputData))

  console.log('useEmcList aftervinput')

  // const lObjToStart = JSON.stringify(vInputData)

  const { data } = await useFetch('/api/emcapi/emcGenericFunctions', {
    method: 'POST',
    body: JSON.stringify({
      master: vMaster,
      data: vInputData?.searchCriteria,
      retreiveConfData: vRetreiveConfData,
      PageParameters: vInputData?.PageParameters,
      action: 'List',
      key: Date.now().toString()
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  console.log('before EMCLIST')
  console.log(data)

  return data
}


export async function useEmcReferenceDataList(vMaster: string, vInputData?: object, vRetreiveConfData: boolean = false, vRetryCount = 0) {
  try {
    

console.log('useEmcReferenceDataList started', vInputData)

  // alert(`/api/emcapi/emcGenericFunctions?q=${vInputData?.id}`)

  console.log(vInputData.id)

  console.log('useEmcReferenceDataList aftervinput')

  // const lObjToStart = JSON.stringify(vInputData)

  const { data, error } = await useFetch(`/api/emcapi/emcGenericFunctions?q=${vInputData?.id || uuid}`, {
    method: 'POST',
    body: {
      master: vMaster,
      data: vInputData,
      retreiveConfData: vRetreiveConfData,
      PageParameters: vInputData?.PageParameters,
      action: vMaster,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    server: false,
  })


  if (error.value) {
    if (error.value.statusCode === 503) {
      let vRetryCountLocal = vRetryCount + 1
      if (vRetryCountLocal > 3) {
        throw error.value
      }
      nextTick()
      nextTick()
      await useEmcReferenceDataList(vMaster, vInputData, vRetreiveConfData, vRetryCountLocal)
    }
  }

  console.log('post useEmcReferenceDataList')
  console.log(data)
  return data
  } catch (error) {
  alert('error')
}
}

export async function useEmcGetDetail(vMaster: string, vInputData?: object, vRetreiveConfData: boolean = false) {
  console.log('useEmcGetDetail started')

  console.log('useEmcGetDetail aftervinput',vInputData?.data)

  console.log('useEmcGetDetail aftervinput')

  // const lObjToStart = JSON.stringify(vInputData)

  const { data } = await useFetch('/api/emcapi/emcGenericFunctions', {
    method: 'POST',
    body: JSON.stringify({
      master: vMaster,
      data: vInputData?.data,
      retreiveConfData: null,
      PageParameters: null,
      action: 'getDetail',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  console.log('before useEmcGetDetail')
  console.log(data)

  return data
}

export async function useEmcGetControlsData(vMaster: string) {
  console.log('useEmcGetControlsData started')

  // const lObjToStart = JSON.stringify(vInputData)

  const { data } = await useFetch('/api/emcapi/emcGenericFunctions', {
    method: 'POST',
    body: JSON.stringify({
      master: vMaster,
      data: null,
      retreiveConfData: null,
      PageParameters: null,
      action: 'GetControlsData',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  console.log('get constrols data11')
  console.log(data.value)

  return data.value
}

export async function useEmcInsert(vMaster: string, vData: object) {
  debugger
  console.log('useEmcInsert started')

  const retValue =  await useFetch('/api/emcapi/emcGenericFunctions', {
    method: 'POST',
    body: JSON.stringify({
      master: vMaster,
      action: 'Insert',
      data: vData,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return retValue
}

export async function useEmcDelete(vMaster: string, vData: object) {
  console.log('useEmcDelete started')

  return await useFetch('/api/emcapi/emcGenericFunctions', {
    method: 'POST',
    body: JSON.stringify({
      master: vMaster,
      action: 'Delete',
      data: vData,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export async function useEmcGetReferenceControlData(vMaster: string, vData: object) {
  console.log('useEmcDelete started', vData)

  return await useFetch('/api/emcapi/emcGenericFunctions', {
    method: 'POST',
    body: JSON.stringify({
      master: vMaster,
      action: 'GetControlsWithinComponent',
      data: vData,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function useEmcfindObjectByName(obj, targetName) {
  if (!obj || typeof obj !== 'object') return null

  for (const key in obj) {
    if (key === targetName) {
      return obj[key]   // ✅ Found the target object
    }

    const found = useEmcfindObjectByName(obj[key], targetName)
    if (found) return found
  }

  return null
}

export async function useEmcGenericList(vUrl: string, InputObject: object) {
  console.log('useEmcGenericList started')

  return await useFetch(vUrl, {
    method: 'POST',
    body: JSON.stringify(InputObject),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
