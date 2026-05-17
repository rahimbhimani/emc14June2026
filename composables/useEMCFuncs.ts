const uuid = () => {
  const cryptoObj = globalThis.crypto
  if (cryptoObj?.randomUUID)
    return cryptoObj.randomUUID()

  if (cryptoObj?.getRandomValues) {
    const bytes = cryptoObj.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = [...bytes].map(b => b.toString(16).padStart(2, '0'))

    return `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function useEmcList(vMaster: string, vInputData?: object, vRetreiveConfData: boolean = false) {
  //console.log('useEmcList started')

  //console.log((vInputData))

  //console.log('useEmcList aftervinput')

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

  //console.log('before EMCLIST')
  //console.log(data)

  return data
}


export async function useEmcReferenceDataList(vMaster: string, vInputData?: object, vRetreiveConfData: boolean = false, vRetryCount = 0) {
  try {


    //console.log('useEmcReferenceDataList started', vInputData)

    // alert(`/api/emcapi/emcGenericFunctions?q=${vInputData?.id}`)

    //console.log(vInputData?.id)

    //console.log('useEmcReferenceDataList aftervinput')

    // const lObjToStart = JSON.stringify(vInputData)

    const requestId = vInputData?.id ?? uuid()
    const { data, error } = await useFetch(`/api/emcapi/emcGenericFunctions?q=${requestId}`, {
      method: 'POST',
      body: {
        master: vMaster,
        data: vInputData,
        retreiveConfData: vRetreiveConfData,
        PageParameters: vInputData?.PageParameters,
        action: vMaster,
        key: Date.now().toString()
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

    //console.log('post useEmcReferenceDataList')
    //console.log(data)
    return data
  } catch (error) {
    alert('error')
  }
}

export async function useEmcGetDetail(vMaster: string, vInputData?: object, vRetreiveConfData: boolean = false) {
  //console.log('useEmcGetDetail started')

  //console.log('useEmcGetDetail aftervinput', vInputData?.data)

  //console.log('useEmcGetDetail aftervinput')

  // const lObjToStart = JSON.stringify(vInputData)

  const { data } = await useFetch('/api/emcapi/emcGenericFunctions', {
    method: 'POST',
    body: JSON.stringify({
      master: vMaster,
      data: vInputData?.data,
      retreiveConfData: null,
      PageParameters: null,
      action: 'getDetail',
      key: Date.now().toString()
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })


  //console.log('before useEmcGetDetail')
  //console.log(data)

  return data
}

export async function useEmcGetControlsData(vMaster: string) {
  //console.log('useEmcGetControlsData started')

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

  //console.log('get constrols data11')
  //console.log(data.value)

  return data.value
}


async function insertWithBinarydata(vMaster: string, vData: object) {
  debugger
  //console.log('useEmcInsert started', vData)
  const fd = new FormData()
  fd.append("data", JSON.stringify({
    master: vMaster,
    action: 'Insert',
    data: vData.FormName,
  }))

  const binArr = vData?.BinaryData || []
  binArr.forEach((x: any, index: number) => {
    const file = x?.dataValue
    if (file instanceof File) {
      fd.append("BinaryFile", file) // ✅ multiple same key
      fd.append("BinaryDataPath", x.datapath || "") // optional
      fd.append("Type", x.Type || "") // optional
    } else {
      //console.log(`❌ BinaryData[${index}] is not File`, file)
    }
  })

  //console.log('FormData prepared for useEmcInsert', fd)
  const retValue = await $fetch('/api/emcapi/emcGenericFunctions', {
    method: 'POST',
    body: fd,
  })

  return retValue
}

export async function useEmcInsert(vMaster: string, vData: object) {
  if (vData?.BinaryData) {
    return await insertWithBinarydata(vMaster, vData)
  }

  //console.log('useEmcInsert started')

  const retValue = await $fetch('/api/emcapi/emcGenericFunctions', {
    method: 'POST',
    body: JSON.stringify({
      master: vMaster,
      action: 'Insert',
      data: vData,
      key: Date.now().toString()
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return retValue

}

export async function useEmcDelete(vMaster: string, vData: object) {
  //console.log('useEmcDelete started')

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

export async function useEmcGetReferenceControlData(
  vMaster: string,
  vData: object
) {
  return await $fetch('/api/emcapi/emcGenericFunctions', {
    method: 'POST',
    body: {
      master: vMaster,
      action: 'GetControlsWithinComponent',
      data: vData,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

// export async function useEmcGetReferenceControlData(vMaster: string, vData: object) {
//   //console.log('useEmcDelete started', vData)

//   return await useFetch('/api/emcapi/emcGenericFunctions', {
//     method: 'POST',
//     body: JSON.stringify({
//       master: vMaster,
//       action: 'GetControlsWithinComponent',
//       data: vData,
//     }),
//     headers: {
//       'Content-Type': 'application/json',
//     },
//   })
// }

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
  //console.log('useEmcGenericList started')

  return await useFetch(vUrl, {
    method: 'POST',
    body: JSON.stringify(InputObject),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
