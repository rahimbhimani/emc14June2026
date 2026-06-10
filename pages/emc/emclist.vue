  <script setup>
  import { useScreenDesignStore } from '@/store/screenDesignStore'
  import { userDataStore } from '@/store/userDataStore'
  import { componentRegistry } from '@/utils/componentRegistry.client'
  import { useValidator } from '~/composables/useEMCValidator'
  provide('componentRegistry', componentRegistry)
  const activeMenu = ref(null)
  const { buildZodSchema, validateField, validateForm, errors, clearErrors } = useValidator()

  const isSnackbarVisible = reactive({ show: false, error: true, message: '' })
  const muserDataStore = userDataStore()
  const screenDesignStore = useScreenDesignStore()
  const route = useRoute()
  const filterpanelexpanded = ref(true)
  const currentMaster = ref('')
  const IsthisFirstServerRequest = ref(false)
  const mFormInputData = reactive({ PageSetup: '', data: [{}], searchCriteria: {}, PageParameters: { CurrentPage: 1 } })
  const mOutPutFormData = reactive({ FormData: {} })
  const mCurrentFunction = ref('list')
  const mErrorOnPage = ref(false)
  const SelectedRows = ref()
  const pageLoading = ref(true)
  const listviewmode = ref('table')
  const isConfirmDialogVisible = ref(false)
  const formRef = ref(null)

  let schema = {}
  let originalValidationSchema = null
  const childValidatorRegistry = new Map()
  //  { "Code": { "_id": "6885e29af2dae01edb4893d8", "title": "Published" } }
  function formValidate() {
    const parentValid = validateForm(schema, muserDataStore.data.FormData.UserEntryObjects.FormName)

    let allChildrenValid = true
    for (const [, { validateFn }] of childValidatorRegistry) {
      const ok = validateFn()
      if (!ok) allChildrenValid = false
    }

    return parentValid && allChildrenValid
  }

  function areAllChildrenDisabled(children) {
    if (!children?.length) return true
    return children.every(child => disbleButton(child.text))
  }

  function getControl(vAttribute) {
    const lPageDetails = ref(GetPageInformation(vAttribute))

    // console.log('tesrr', lPageDetails.value)

    return resolveComponent(lPageDetails.value)
  }

  function GetPageInformation(vAttribute) {
    const lPageComponent = ref('')

    switch (vAttribute) {
      case 'create': case 'edit':
        switch (currentMaster.value) {
          case 'ScreenConfigure':
            lPageComponent.value = 'emcDTcreatescreendesign'
            break;
          default:
            lPageComponent.value = 'emccreatecomponent'
            break;
        }
        break; // Added break here to prevent fall-through into 'list'
      case 'list':
        lPageComponent.value = 'emclistcomponent'
        break; // Added break for 'list'

      default:
        lPageComponent.value = 'emclistcomponent'
        break; // Added break for 'default'
    }

    return lPageComponent.value
  }

  watch(() => route.path, newRoute => {
    ////debugger
    if (newRoute.toLowerCase().indexOf('emclist')) {
      IsthisFirstServerRequest.value = true
      mFormInputData.searchCriteria = {}
      clearListData()
      btnMoveToList()
    }
    else if (newRoute.toLowerCase().indexOf('emccreate')) {
      // listData()
      clearListData()
    }
  })

  async function clearListData() {
    mFormInputData.PageSetup = ''
    SelectedRows.value = []
    mFormInputData.PageParameters = { CurrentPage: 1 }
  }


  async function GetDetailData() {
    ////debugger
    mCurrentFunction.value = 'edit'

    mErrorOnPage.value = false

    // alert('rahim1')
    mFormInputData.data = [{ _id: SelectedRows.value[0]._id }]

    // mFormInputData.data.push({ _id: SelectedRows.value[0]._id })
    // alert('rahim2')

    const res = await useEmcGetDetail(currentMaster.value, mFormInputData, false)

    console.log('res the greatest', res.value.detail)

    return res.value.detail

    // muserDataStore.data.FormData.DataObject = res.value.detail
  }

  async function listData() {
    mCurrentFunction.value = 'list'

    mErrorOnPage.value = false

    if (currentMaster.value !== route.params.vmaster || currentMaster.value === '') {
      mFormInputData.searchCriteria = {}
      currentMaster.value = route.params.vmaster
    }

    // alert('Before')

    const lObj = await useEmcList(currentMaster.value, mFormInputData, IsthisFirstServerRequest.value)
    ////debugger

    console.log('LISTDATAINLIST', lObj)

    console.log('consolesdsdfsdf', lObj.value.FormData.error)
    if (lObj.value.FormData.error.errorCode !== '') {
      mErrorOnPage.value = true
      return
    }



    if (IsthisFirstServerRequest.value === true) {
      mOutPutFormData.FormData.ListHeaders = prepareHeaders(lObj.value?.FormData.ListHeaders)
      mOutPutFormData.FormData.FormRTSearchObjects = lObj.value?.FormData.FormRTSearchObjects
      mOutPutFormData.FormData.FormParameters = lObj.value?.FormData.FormParameters
      mOutPutFormData.FormData.UserEntryObjects = lObj.value?.FormData.UserEntryObjects
      mOutPutFormData.FormData.validationSchema = lObj.value?.FormData.validationSchema
      originalValidationSchema = JSON.parse(JSON.stringify(mOutPutFormData.FormData.validationSchema || {}))
      schema = mOutPutFormData.FormData.validationSchema ? buildZodSchema(mOutPutFormData.FormData.validationSchema) : {}
      if (currentMaster.value !== 'ScreenConfigure')
        muserDataStore.data.FormData.UserEntryObjects.FormName = JSON.parse(JSON.stringify((lObj.value?.FormData.UserEntryObjects)))
    }
    // alert('outside err')


    mOutPutFormData.FormData.GridData = lObj.value?.FormData.GridData

    // Restore selection based on _id
    if (SelectedRows.value?.length) {
      const selectedIds = SelectedRows.value.map(x => x._id)

      SelectedRows.value = mOutPutFormData.FormData.GridData.filter(item =>
        selectedIds.includes(item._id)
      )
    }

    mFormInputData.PageParameters.TotalRecordCount = lObj.value?.FormData.PaginationOutPutData.TotalRecordCount
    mFormInputData.PageParameters.TotalPages = lObj.value?.FormData.PaginationOutPutData.TotalPages
    mFormInputData.PageParameters.Limit = lObj.value?.FormData.PaginationOutPutData.Limit
    IsthisFirstServerRequest.value = false
  }

  function showFormattedvalueOnlist(path) {
    // You can customize this formatting logic
    return (item) => {
      // Access nested property dynamically
      // return path
      const lretValue = path.replace('FormName.', '').split('.').reduce((acc, key) => acc?.[key], item) || 'Error'
      return lretValue?.length > 0
        ? `${lretValue[0]?.title}${lretValue?.length > 1 ? ' +' + (lretValue?.length - 1) : ''}`
        : '-';
    }
  }

  function prepareHeaders(listHeaders) {
    return listHeaders.map(h => {
      const newHeader = { ...h }
      if (typeof h.value === 'string' && h.value.startsWith('showFormattedvalueOnlist')) {
        // Extract path from inside the function call
        const match = h.value.match(/showFormattedvalueOnlist\((.*)\)/)
        if (match) {
          const path = match[1]
          newHeader.value = showFormattedvalueOnlist(path) // assign function
        }
      }

      return newHeader
    })
  }


  const isMounted = ref(false)
  onMounted(async () => {
    // alert(route.path)
    if (route.path.toLowerCase().indexOf('emclist')) {
      IsthisFirstServerRequest.value = true
      SelectedRows.value = []
      await clearListData()
      await btnMoveToList()
    }
    else if (route.path.toLowerCase().indexOf('emccreate')) {
      // listData()
    }
    await nextTick()
    isMounted.value = true
  })

  async function btnMoveToDelete() {
    isConfirmDialogVisible.value = true
  }

  async function handleDelete(vBool) {
    if (vBool === true) {
      const lObj = await useEmcDelete(currentMaster.value, SelectedRows.value)
      ////debugger
      if (lObj?.status.value === 'success')
        informUser('success', 'Data Deleted sucessfully')
      await btnMoveToList()
    }
  }



  async function btnMoveToList() {
    debugger
    pageLoading.value = true
    // alert(mCurrentFunction.value)
    if (mCurrentFunction.value === 'back') {
      // alert(mCurrentFunction.value)
      await clearListData()
    }

    if (mFormInputData.PageParameters === undefined)
      mFormInputData.PageParameters = { CurrentPage: 1 }
    else
      if (mCurrentFunction.value === 'back') {
        mFormInputData.searchCriteria = {}
        mFormInputData.PageParameters.CurrentPage = 1
      }
    mCurrentFunction.value = 'list'
    await listData()
    pageLoading.value = false

  }


  async function btnMoveToCreate() {
    ////debugger
    pageLoading.value = true
    if (currentMaster.value === 'ScreenConfigure') {
      // muserDataStore.data.FormData = Object({})
      muserDataStore.data.FormData.DataObject = Object({})
      screenDesignStore.board = []
    }

    if (currentMaster.value !== 'ScreenConfigure') {
      // muserDataStore.data.FormData.UserEntryObjects = Object({})
      muserDataStore.data.FormData.UserEntryObjects.FormName = JSON.parse(JSON.stringify(mOutPutFormData.FormData.UserEntryObjects)) //Object({})
    }

    muserDataStore._id = undefined
    screenDesignStore['_id'] = undefined
    // muserDataStore.data.FormData.DataObject = Object({}).
    mFormInputData.data = Object({})
    mCurrentFunction.value = 'create'
    mErrorOnPage.value = false
    clearErrors()
    // pageLoading.value = false

    // alert(mCurrentFunction.value)
  }


  async function btnMoveToEdit(vAction = 'edit') {
    ////debugger

    // console.log('GetDetailData()', await GetDetailData())
    ////debugger

    pageLoading.value = true
    const lTemp = await GetDetailData()

    // muserDataStore.data.FormData = Object({})
    // mFormInputData.data = Object({})

    if (currentMaster.value === 'ScreenConfigure') {
      muserDataStore.data.FormData = Object({})
      muserDataStore.data.FormData.DataObject = { ...lTemp.FormDTObjects }
      // alert(lTemp._id)
      muserDataStore.data.FormData.DataObject['_id'] = lTemp._id
      screenDesignStore.board = lTemp.FormDTObjects.board
      if (vAction === 'copy') {
        delete muserDataStore.data.FormData.DataObject['_id']
        delete screenDesignStore['_id']
        alert('Screen design copied. Please make necessary changes and save with a new name to avoid confusion with existing design.')
      }
      else {
        screenDesignStore['_id'] = lTemp._id
      }
      //alert(screenDesignStore.board._id)
    }
    if (currentMaster.value !== 'ScreenConfigure') {
      clearErrors()
      // muserDataStore.data.FormData.UserEntryObjects = Object({})
      if (vAction === 'copy')
        delete lTemp._id

      muserDataStore.data.FormData.UserEntryObjects.FormName = { ...lTemp }
      ////debugger
      console.log('muserDataStore.data.FormData.UserEntryObjects.FormName', muserDataStore.data.FormData.UserEntryObjects.FormName)
    }

    // muserDataStore.data.FormData.UserEntryObjects.FormName = await GetDetailData()

    mCurrentFunction.value = vAction === 'copy' ? 'create' : vAction === 'refresh' ? 'edit' : mCurrentFunction.value
    mErrorOnPage.value = false
  }

  async function btnMoveToSave(vAction = 'save') {

    console.log(muserDataStore.data.FormData.DataObject)
    debugger

    const master = currentMaster.value;
    let payload = master === 'ScreenConfigure'
      ? screenDesignStore
      : muserDataStore.data?.FormData.UserEntryObjects.FormName
    // If not ScreenConfigure, validate form first
    if (master !== 'ScreenConfigure') {

      const result = await formValidate()
      if (result === false) {
        await informUser('error', 'form validation failed.')
        return
      }
    }

    // Call insert logic
    if (vAction === 'validate') {
      payload._isThisForValidate = true
    }
    const lObj = await useEmcInsert(master, payload)

    ////debugger;
    console.log(lObj?.status.value)
    // let success = lObj?.data.value.success
    let success = lObj?.status.value || lObj?.success
    console.log(success)
    if (success === 'success')
      success = true


    if (vAction === 'validate') {
      if (success === true) {
        await informUser('success', 'Validation successful.')
      } else if (success === false) {
        await informUser('error', `Validation Failed ! \n ${lObj?.message || lObj?.data?.value?.message || 'Unknown error'}`)
      }
    } else {
      if (success === true) {
        if (lObj?.insertedID)
          muserDataStore.data.FormData.UserEntryObjects.FormName._id = lObj?.insertedID
        await informUser('success', `Data successfully ${lObj?.insertedID ? 'created' : 'updated'}. `)
      } else if (success === false) {
        // alert(lObj?.data.value.insertedID)
        await informUser('error', `${lObj?.insertedID || lObj?.insertedID === undefined ? 'Create' : 'Update'} action Failed ! \n ${lObj?.message}`)
      }
    }
  }


  async function informUser(vShow, vMessage) {
    // alert(vState)
    if (vShow === 'success') {
      // alert('rahim')
      isSnackbarVisible.show = true
      isSnackbarVisible.error = false
      isSnackbarVisible.message = vMessage
    }
    if (vShow === 'error') {
      // alert('rahim11')
      isSnackbarVisible.show = true
      isSnackbarVisible.error = true
      isSnackbarVisible.message = vMessage.replace(/\n/g, '<br>')
    }
  }
  // const lPermission = { create: ['delete', 'edit'], edit: ['edit', 'delete', 'create'], save: ['create', 'save', 'list'], list: ['save', 'delete', 'edit'] }

  // function disbleButton(vAction) {
  //   if (vAction === 'delete')
  //     return !(lPermission[mCurrentFunction.value.toLocaleLowerCase()]?.includes('delete') && (SelectedRows.value?.length > 0 && mCurrentFunction.value.toLocaleLowerCase() === 'list'))

  //   if (vAction === 'edit' && mCurrentFunction.value === 'list')
  //     return !(lPermission[mCurrentFunction.value.toLocaleLowerCase()]?.includes('edit') && (SelectedRows.value?.length === 1))

  //   return lPermission[mCurrentFunction.value.toLocaleLowerCase()]?.includes(vAction)
  // }

  const lPermission = {
    create: ['delete', 'edit', 'copy', 'template', 'excel_load', 'back', 'print', 'export_excel'],
    edit: ['edit', 'delete', 'create', 'print', 'export_excel'],
    save: ['create', 'save', 'list'],
    list: ['save'],
    print: ['list', 'create', 'edit'],
  }

  function disbleButton(vAction) {
    //debugger
    const mode = mCurrentFunction.value?.toLowerCase()
    const selectedCount = SelectedRows.value?.length || 0

    let item = vConfToolbar.find(btn => btn.text === vAction)

    if (!item) {
      for (const parent of vConfToolbar) {
        if (parent.children) {
          item = parent.children.find(child => child.text === vAction)
          if (item) break
        }
      }
    }

    if (!item) return false

    // Disable by mode
    if (item.hide?.includes(mode))
      return true

    // Permission rule
    if (lPermission[mode]?.includes(vAction))
      return true

    // Selection rule
    const min = item.selection?.min ?? 0
    const max = item.selection?.max ?? Infinity

    if (selectedCount < min || selectedCount > max)
      return true

    return false
  }

  const vConfToolbar = [
    {
      text: 'create',
      caption: 'Create',
      icon: 'emcAdd',
      order: 1,
      hide: ['delete', 'copy', 'template', 'excel_load'],
      selection: { min: 0, max: 999 },
      children: [
        {
          text: 'copy',
          caption: 'Copy',
          icon: 'mdi:content-copy',
          hide: ['create'],
          selection: { min: 1, max: 1 }
        },
        // {
        //   text: 'template',
        //   caption: 'Create from Template',
        //   icon: 'mdi:content-copy',
        //   selection: { min: 0, max: 0 }
        // },
        {
          text: 'excel_load',
          caption: 'load via Excel',
          icon: 'mdi:file-excel',
          selection: { min: 0, max: 0 },
          children: [
            {
              text: 'copy',
              caption: 'Copy',
              icon: 'mdi:content-copy',
              hide: ['create'],
              selection: { min: 1, max: 1 }
            }

          ]
        }
      ]
    },
    {
      text: 'save',
      caption: 'Save',
      icon: 'emcSave',
      order: 2,
      hide: ['list'],
      selection: { min: 0, max: 999 },
      children: [
        {
          text: 'validate',
          caption: 'Validate',
          icon: 'mdi:check',
          hide: ['list'],
          selection: { min: 0, max: 999 }
        }
      ]
    },
    {
      text: 'list',
      caption: 'List',
      icon: 'emcList',
      order: 2,
      hide: [],
      selection: { min: 0, max: 999 },
      children: [
        {
          text: 'back',
          caption: 'Reset List',
          icon: 'mdi:arrow-left',
          hide: [],
          selection: { min: 1, max: 999 }
        }
      ]
    },
    {
      text: 'edit',
      caption: 'Edit',
      icon: 'emcEdit',
      order: 4,
      hide: ['create', 'save'],
      selection: { min: 1, max: 1 },
      children: [
        {
          text: 'refresh',
          caption: 'Refresh',
          icon: 'mdi:refresh',
          hide: ['list', 'create', 'save'],
          selection: { min: 1, max: 1 }
        }
      ]
    },
    {
      text: 'delete',
      caption: 'Delete',
      icon: 'mdi:delete',
      color: 'red',
      order: 5,
      selection: { min: 1, max: 999 }
    },
    {
      text: 'more',
      caption: '',
      icon: 'mdi:dots-vertical',
      order: 999,
      menuOnly: true,
      children: [
        { text: 'print', caption: 'Print', icon: 'mdi:printer', selection: { min: 0, max: 999 } },
        { text: 'export_excel', caption: 'Export', icon: 'mdi:file-excel', selection: { min: 0, max: 999 } }
      ]
    }
  ]


  function perforFunction(vAction) {

    switch (vAction) {
      case 'create':
        btnMoveToCreate()
        break
      case 'copy':
        btnMoveToEdit(vAction)
        break
      case 'refresh':
        btnMoveToEdit(vAction)
        break
      case 'validate':
        btnMoveToSave(vAction)
        break
      case 'save':
        btnMoveToSave()
        break
      case 'back':
        mCurrentFunction.value = vAction
        btnMoveToList()
        break
      case 'list':
        // alert(vAction)
        // mCurrentFunction.value = vAction
        btnMoveToList()
        break
      case 'delete':
        btnMoveToDelete()
        break
      case 'edit':
        btnMoveToEdit()
        break;
      case 'print':
        PrintOnPage()
        break;
      // case default:
      //   btnMoveToCreate()
    }
  }




  function PrintOnPage() {
    const { runReport } =
      emcUseReportRunner()
    runReport({
      screenId: "emcTrolley",
      reportName:
        "Trolley Report",
      format: "HTML"
    })
  }

  function clientValidate(vControlName) {

    return [validateField(schema, vControlName)]
  }

  provide('clientErrors', errors)
  provide('clientValidate', clientValidate)

  function setSchemaAtPath(obj, path, value) {
    const keys = path.split('.')
    let cur = obj
    for (let i = 0; i < keys.length - 1; i++) {
      if (!cur[keys[i]] || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {}
      cur = cur[keys[i]]
    }
    cur[keys[keys.length - 1]] = value
  }

  function rebuildSchema() {
    if (!originalValidationSchema) return
    const merged = JSON.parse(JSON.stringify(originalValidationSchema))
    for (const [dataPath, { rawSchema }] of childValidatorRegistry) {
      if (!rawSchema) continue
      // validationSchema is rooted at the FormName level, so strip "FormName." prefix
      const schemaPath = dataPath.startsWith('FormName.')
        ? dataPath.slice('FormName.'.length)
        : dataPath
      setSchemaAtPath(merged, schemaPath, rawSchema)
    }
    mOutPutFormData.FormData.validationSchema = merged
    schema = buildZodSchema(merged)
  }

  provide('registerChildValidator', (dataPath, rawSchema, validateFn) => {
    childValidatorRegistry.set(dataPath, { rawSchema, validateFn })
    rebuildSchema()
  })

  provide('unregisterChildValidator', (dataPath) => {
    childValidatorRegistry.delete(dataPath)
    rebuildSchema()
  })
  // In any component

  const { organization } = useOrgDetails()

  // Access organization data


</script>
<template>
  <!-- {{ mCurrentFunction }} -->
  <!-- {{ SelectedRows }} -->
  <!-- RAHIM BHIMANI
  {{ organization.Name }}
  {{ organization.icon }}
  {{ organization.logo }} -->
  <!-- {{ muserDataStore.data.FormData.UserEntryObjects }} -->
  <!-- {{ mOutPutFormData.FormData.ListHeaders }} -->
  <!-- {{ errors }} -->
  <!-- {{ muserDataStore?.data }} -->
  <!-- {{ schema }} -->
  <!-- {{ muserDataStore.data?.FormData.UserEntryObjects.FormName }} -->
  <!-- {{ muserDataStore.data?.FormData.UserEntryObjects.FormName }} -->
  <!-- <br/> -->
  <!-- {{ muserDataStore.data?.FormData }} -->
  <!-- <br/> -->
  <!-- <br/> -->
  <!-- {{ mOutPutFormData.FormData.GridData }} -->
  <!-- {{ mFormInputData }}   -->
  <!-- <br/> -->
  <!-- <br /> -->
  <!-- {{ errors }} -->
  <!-- <br/> -->
  <!-- <br/> -->
  <!-- {{ schema }} -->
  <!-- <br/> -->
  <!-- <br/> -->
  <!-- {{ mOutPutFormData?.FormData.validationSchema }} -->
  <!-- {{ mOutPutFormData.FormData.UserEntryObjects }} -->
  <!-- {{ mOutPutFormData.FormData }} -->
  <!-- <hr/> -->
  <!-- <br/> -->


  <!-- {{ muserDataStore }} -->
  <!-- <VBtn @click="formValidate">
    Validate 
    <VIcon
      size="18px"
      color="green"
    >
    </VIcon>
  </VBtn> -->
  <!-- {{muserDataStore.data.FormData.UserEntryObjects.FormName }}-->
  <!-- {{ muserDataStore.data.FormData.DataObject }}  -->
  <!-- {{errors}} -->
  <!-- <hr/> -->
  <!-- {{ schema }} -->
  <!-- {{ schema }}
  <VTextField
        v-model="firstName"
        label="key"
        :rules="clientValidate('Description')"
      /> -->
  <ConfirmAction v-model:isDialogVisible="isConfirmDialogVisible"
    confirmation-question="Selected records will be deleted, do you wish to continue ?"
    cancel-msg="Unsubscription Cancelled!!" cancel-title="Cancelled"
    confirm-msg="Your subscription cancelled successfully." confirm-title="Unsubscribed!" @confirm="handleDelete" />


  <VSkeletonLoader v-if="isMounted === false" class="mx-auto" elevation="12" type="table-row-divider, table-tbody">
  </VSkeletonLoader>

  <VCard v-else dense elevation="6">
    <!-- <VToolbar style="background-color: transparent;" density="compact" class="ml-2 pa-0">

      <div style="display: flex; align-items: baseline; gap: 6px;">
        <h2 class="text-truncate" style="margin: 0; color: black; font-weight: bold;max-inline-size: 100%;">
          {{ mOutPutFormData.FormData.FormParameters?.Title }}
        </h2>
        <h5 class="text-truncate"
          style="margin: 0; color: darkgray; font-family: sans-serif; font-style: italic; font-weight: lighter;max-inline-size: 60%;">
          {{ mOutPutFormData.FormData.FormParameters?.Description }}
        </h5>
      </div>

      <VSpacer />
      <VSpacer />

      <VBtn v-for="inividualControl in vConfToolbar.sort((firstItem, secondItem) => firstItem.order - secondItem.order)"
        :key="inividualControl.index" color="#5865f2" density="comfortable"
        :disabled="pageLoading === true ? true : disbleButton(inividualControl.text)"
        @click="perforFunction(inividualControl.text)">
        <template #prepend>
          <VIcon :icon="inividualControl.icon" />
        </template>
<h5 style="font-weight: normal;">
  {{ inividualControl.caption }}
</h5>
</VBtn>

<VBtn :color="mFormInputData.searchCriteria?.length > 0 ? '#008000' : 'red'"
  @click="filterpanelexpanded = !filterpanelexpanded">
  <VIcon size="18px" color="green" :icon="mFormInputData.searchCriteria.length > 0 ? 'mdi:filter' : 'mdi:filter-off'">
  </VIcon>
</VBtn>
</VToolbar> -->
    <VToolbar style="background-color: transparent;" density="compact" class="pa-0">
      <!-- Title -->

      <div style="display: flex; align-items: baseline; gap: 6px;" class="ml-2">
        <h2 class="text-truncate text-high-emphasis" style="margin: 0; font-weight: bold; max-inline-size: 100%;">
          {{ mOutPutFormData.FormData.FormParameters?.Title }}
        </h2>

        <h5 class="text-truncate text-medium-emphasis"
          style="margin: 0; font-style: italic; font-weight: lighter; max-inline-size: 60%;">
          {{ mOutPutFormData.FormData.FormParameters?.Description }}
        </h5>
      </div>

      <VSpacer />
      <VSpacer />

      <!-- Title -->
      <template v-for="item in vConfToolbar
        .filter(x => !x.hidden)
        .sort((a, b) => a.order - b.order)" :key="item.text">
        <!-- MENU ONLY (burger) -->
        <VMenu v-if="item.menuOnly" location="bottom end">
          <template #activator="{ props }">
            <VBtn v-bind="props" color="#5865f2" density="comfortable"
              :disabled="pageLoading ? true : areAllChildrenDisabled(item.children)">
              <VIcon :icon="item.icon" color="black" />
            </VBtn>
          </template>

          <VList density="compact" min-width="220">
            <VListItem v-for="child in item.children" :key="child.text"
              :disabled="pageLoading ? true : disbleButton(child.text)" @click="perforFunction(child.text)">
              <template #prepend>
                <VIcon :icon="child.icon" />
              </template>

              <VListItemTitle>
                {{ child.caption }} ({{ child.text }})
              </VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>

        <!-- SPLIT MENU -->
        <VMenu v-else-if="item.children" :model-value="activeMenu === item.text"
          @update:model-value="val => activeMenu = val ? item.text : null" location="bottom end">
          <template #activator="{ props }">
            <div class="split-menu-wrapper" :class="{ 'split-menu-active': activeMenu === item.text }">
              <VBtn :color="item.color ? item.color : 'black'" density="comfortable" class="split-main-btn"
                :disabled="pageLoading ? true : disbleButton(item.text)" @click="perforFunction(item.text)">
                <template #prepend>
                  <VIcon :icon="item.icon" />
                </template>
                {{ item.caption }}
              </VBtn>

              <VBtn v-bind="props" color="#5865f2" density="comfortable" class="split-arrow-btn"
                :disabled="pageLoading ? true : areAllChildrenDisabled(item.children)">
                <VIcon icon="mdi:chevron-down" size="16" color="black" />
              </VBtn>
            </div>
          </template>

          <VList density="compact">
            <VListItem v-for="child in item.children" :key="item.text + '-' + child.text"
              :disabled="pageLoading ? true : disbleButton(child.text)" @click="perforFunction(child.text)">
              <template #prepend>
                <VIcon :icon="child.icon" />
              </template>

              <VListItemTitle>
                {{ child.caption }}
              </VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>

        <!-- NORMAL BUTTON -->
        <VBtn v-else color="#5865f2" density="comfortable" class="menu-toolbar-btn"
          :disabled="pageLoading ? true : disbleButton(item.text)" @click="perforFunction(item.text)">
          <template #prepend>
            <VIcon :icon="item.icon" color="black" />
          </template>

          {{ item.caption }}
        </VBtn>
      </template>
      <!-- Filter Button -->
      <VBtn :color="mFormInputData.searchCriteria?.length > 0 ? '#008000' : 'red'"
        @click="filterpanelexpanded = !filterpanelexpanded">
        <VIcon size="18px" color="green"
          :icon="mFormInputData.searchCriteria.length > 0 ? 'mdi:filter' : 'mdi:filter-off'" />
      </VBtn>
    </VToolbar>
  </VCard>
  <div v-if="mErrorOnPage === true"
    style=" display: flex;align-items: center; justify-content: center; block-size: 300px; inline-size: 100%;">
    <VContainer>
      <VRow no-gutters justify="center" style="display: flex;align-items: center; justify-content: center;">
        <VCol class="d-flex flex-wrap justify-space-between gap-4 mb-6"
          style="display: flex;align-items: center; justify-content: center; background-color: transparent; color: transparent;">
          <VBtn style="background-color: transparent !important;">
            <VIcon size="18px" style=" border: 0;background-color: transparent;" class="mr-4" icon="emcdelete">
            </VIcon>
            <H2 class="text-error">
              Error In Configuration
            </H2>
          </VBtn>
        </VCol>
      </VRow>
    </VContainer>
  </div>

  <VCard v-if="mCurrentFunction === 'list' && currentMaster !== '' && mOutPutFormData.FormData !== undefined"
    class="mx-auto mt-2">

    <div v-show="mErrorOnPage === false && filterpanelexpanded === true">
      <!-- {{ mFormInputData.searchCriteria }} -->
      <EmcSearchbar :searchAttributes="mOutPutFormData.FormData.FormRTSearchObjects"
        v-model:outputSearchCriteria="mFormInputData.searchCriteria" v-model:filterpanelexpanded="filterpanelexpanded"
        v-model:loading="pageLoading" v-model:listviewmode="listviewmode" density="compact" />
    </div>
  </VCard>

  <!-- {{ muserDataStore.data.FormData }} -->
  <!-- {{getControl(mCurrentFunction)}} -->
  <!-- {{ muserDataStore }}   -->
  <!-- {{ mFormInputData }} -->
  <!-- {{ muserDataStore.data.FormData.DataObject }} -->
  <!-- {{ SelectedRows }}{{ currentMaster }}{{ mCurrentFunction }} -->
  <VForm ref="formRef">
    <VCard class="mt-2 mx-auto" style="background-color: transparent;">
      <component :is="getControl(mCurrentFunction)" v-model:vmaster="currentMaster"
        v-model:PaginationParameters="mFormInputData.PageParameters" v-model:SelectedRows="SelectedRows"
        v-model:dataObject="muserDataStore.data.FormData.DataObject" v-model:loading="pageLoading"
        :OutputDataForList="mErrorOnPage === true ? null : mOutPutFormData.FormData.GridData"
        :ListHeaders="mErrorOnPage === true ? null : mOutPutFormData.FormData.ListHeaders" @selectionchanged="listData"
        v-model:listviewmode="listviewmode" />
    </VCard>
  </VForm>

  <!-- </NuxtPage> -->
  <VSnackbar v-model="isSnackbarVisible.show" location="top center"
    :color="isSnackbarVisible.error !== false ? 'error' : 'success'" variant="elevated" :timeout="2000"
    density="compact">
    <div style="text-align: center;">
      <div v-html="isSnackbarVisible.message"></div>
      <!-- {{ isSnackbarVisible.message }} -->
    </div>
  </vsnackbar>
</template>
<!-- <style scoped>
.split-btn-wrapper {
  display: inline-flex;
  align-items: center;
  margin-inline-end: 6px;
}

.split-main-btn {
  border-radius: 6px 0 0 6px !important;
}

.split-arrow-btn {
  padding: 0 !important;
  border-radius: 0 6px 6px 0 !important;
  background: transparent !important;
  border-inline-start: 1px solid rgba(0, 0, 0, 8%);
  inline-size: 28px !important;
  margin-inline-start: -1px !important;
  min-inline-size: 28px !important;
}

.split-btn-wrapper:hover .split-main-btn,
.split-btn-wrapper:hover .split-arrow-btn,
.split-active .split-main-btn,
.split-active .split-arrow-btn {
  background-color: rgba(88, 101, 242, 12%) !important;
}

.split-arrow-btn .v-icon {
  font-size: 14px !important;
}
</style> -->
<style scoped>
.split-menu-wrapper {
  display: inline-flex;
  align-items: center;
  margin-inline-end: 6px;
}

/* Main side */
.split-main-btn {
  overflow: hidden !important;
  border-radius: 6px 0 0 6px !important;
}

.split-main-btn :deep(.v-btn__overlay) {
  border-radius: 6px 0 0 6px;
}

/* Arrow side */
.split-arrow-btn {
  overflow: hidden !important;
  padding: 0 !important;
  border-radius: 0 6px 6px 0 !important;
  border-inline-start: 1px solid rgba(var(--v-border-color), 0.12);
  inline-size: 34px !important;
  margin-inline-start: -1px !important;
  min-inline-size: 34px !important;
}

.split-arrow-btn :deep(.v-btn__overlay) {
  border-radius: 0 6px 6px 0;
}

/* Normal toolbar button */
.menu-toolbar-btn {
  overflow: hidden !important;
}

/* Suppress Vuetify's individual per-button hover so the wrapper hover is the only effect */
.split-menu-wrapper .split-main-btn :deep(.v-btn__overlay),
.split-menu-wrapper .split-arrow-btn :deep(.v-btn__overlay) {
  opacity: 0 !important;
  transition: none !important;
}

/* Shared hover — both halves respond together as one control */
.split-menu-wrapper:hover .split-main-btn,
.split-menu-wrapper:hover .split-arrow-btn,
.split-menu-active .split-main-btn,
.split-menu-active .split-arrow-btn {
  background-color: rgba(88, 101, 242, 12%) !important;
}

/* Disabled still visible */
.split-main-btn.v-btn--disabled,
.split-arrow-btn.v-btn--disabled {
  opacity: 0.45 !important;
}
</style>
