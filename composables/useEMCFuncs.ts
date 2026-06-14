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
  const headers = import.meta.server ? useRequestHeaders(['cookie']) : {}

  const data = await $fetch('/api/emcapi/emcGenericFunctions', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: {
      master: vMaster,
      data: vInputData?.searchCriteria,
      retreiveConfData: vRetreiveConfData,
      PageParameters: vInputData?.PageParameters,
      action: 'List',
      key: Date.now().toString(),
    },
  })

  return ref(data)
}


export async function useEmcReferenceDataList(vMaster: string, vInputData?: object, vRetreiveConfData: boolean = false, vRetryCount = 0) {
  try {
    const headers = import.meta.server ? useRequestHeaders(['cookie']) : {}
    const requestId = vInputData?.id ?? uuid()
    const data = await $fetch(`/api/emcapi/emcGenericFunctions?q=${requestId}`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: {
        master: vMaster,
        data: vInputData,
        retreiveConfData: vRetreiveConfData,
        PageParameters: vInputData?.PageParameters,
        action: vMaster,
        key: Date.now().toString(),
      },
    })

    return ref(data)
  }
  catch (error: any) {
    if (error?.statusCode === 503) {
      const vRetryCountLocal = vRetryCount + 1
      if (vRetryCountLocal > 3)
        throw error
      await nextTick()
      await nextTick()
      return await useEmcReferenceDataList(vMaster, vInputData, vRetreiveConfData, vRetryCountLocal)
    }
    alert('error')
  }
}

export async function useEmcGetDetail(vMaster: string, vInputData?: object, vRetreiveConfData: boolean = false) {
  const headers = import.meta.server ? useRequestHeaders(['cookie']) : {}

  const data = await $fetch('/api/emcapi/emcGenericFunctions', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: {
      master: vMaster,
      data: vInputData?.data,
      retreiveConfData: null,
      PageParameters: null,
      action: 'getDetail',
      key: Date.now().toString(),
    },
  })

  return ref(data)
}

export async function useEmcGetControlsData(vMaster: string) {
  const headers = import.meta.server ? useRequestHeaders(['cookie']) : {}

  return await $fetch('/api/emcapi/emcGenericFunctions', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: {
      master: vMaster,
      data: null,
      retreiveConfData: null,
      PageParameters: null,
      action: 'GetControlsData',
    },
  })
}


async function insertWithBinarydata(vMaster: string, vData: object) {
  debugger
  const fd = new FormData()
  fd.append('data', JSON.stringify({
    master: vMaster,
    action: 'Insert',
    data: vData.FormName,
  }))

  const binArr = vData?.BinaryData || []
  binArr.forEach((x: any) => {
    const file = x?.dataValue
    if (file instanceof File) {
      fd.append('BinaryFile', file)
      fd.append('BinaryDataPath', x.datapath || '')
      fd.append('Type', x.Type || '')
    }
  })

  return await $fetch('/api/emcapi/emcGenericFunctions', {
    method: 'POST',
    credentials: 'include',
    body: fd,
  })
}

export async function useEmcInsert(vMaster: string, vData: object) {
  if (vData?.BinaryData) {
    const result = await insertWithBinarydata(vMaster, vData)
    return { status: ref('success'), data: ref(result), ...(result as any) }
  }

  try {
    const result = await $fetch('/api/emcapi/emcGenericFunctions', {
      method: 'POST',
      credentials: 'include',
      body: {
        master: vMaster,
        action: 'Insert',
        data: vData,
        key: Date.now().toString(),
      },
    })
    return { status: ref('success'), data: ref(result), ...(result as any) }
  }
  catch (err: any) {
    return { status: ref('error'), data: ref(null), success: false, message: err?.message || 'Insert failed' }
  }
}

export async function useEmcDelete(vMaster: string, vData: object) {
  try {
    const result = await $fetch('/api/emcapi/emcGenericFunctions', {
      method: 'POST',
      credentials: 'include',
      body: {
        master: vMaster,
        action: 'Delete',
        data: vData,
      },
    })
    return { status: ref('success'), data: ref(result), ...(result as any) }
  }
  catch (err: any) {
    return { status: ref('error'), data: ref(null), success: false, message: err?.message || 'Delete failed' }
  }
}

export async function useEmcGetReferenceControlData(
  vMaster: string,
  vData: object,
) {
  return await $fetch('/api/emcapi/emcGenericFunctions', {
    method: 'POST',
    credentials: 'include',
    body: {
      master: vMaster,
      action: 'GetControlsWithinComponent',
      data: vData,
    },
  })
}

export function useEmcfindObjectByName(obj, targetName) {
  if (!obj || typeof obj !== 'object') return null

  for (const key in obj) {
    if (key === targetName) {
      return obj[key]
    }

    const found = useEmcfindObjectByName(obj[key], targetName)
    if (found) return found
  }

  return null
}

export async function useEmcGenericList(vUrl: string, InputObject: object) {
  const data = await $fetch(vUrl, {
    method: 'POST',
    credentials: 'include',
    body: InputObject,
  })
  return { data: ref(data), status: ref('success') }
}
