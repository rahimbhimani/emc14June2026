  <script setup>
  import { useScreenDesignStore } from '@/store/screenDesignStore'
  import { userDataStore } from '@/store/userDataStore'
  import { componentRegistry } from '@/utils/componentRegistry.client'
  import { useValidator } from '~/composables/useEMCValidator'
  provide('componentRegistry', componentRegistry)

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
  //  { "Code": { "_id": "6885e29af2dae01edb4893d8", "title": "Published" } }
  function formValidate() {
    ////debugger
    // muserDataStore.data.FormData.UserEntryObjects.FormName = { "TabRateManagent": { "TbRateMgmt": { "Reference": undefined, "ContractType": { "_id": "6885e29af2dae01edb4893d8", "title": "Published" } } } }
    const result = validateForm(schema, muserDataStore.data.FormData.UserEntryObjects.FormName)

    // alert(result)

    if (!result.success) {
      console.log(result.error);
    }
    return result
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
    //debugger
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
    //debugger
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
    //debugger

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
      schema = mOutPutFormData.FormData.validationSchema ? buildZodSchema(mOutPutFormData.FormData.validationSchema) : {}
      if (currentMaster.value !== 'ScreenConfigure')
        muserDataStore.data.FormData.UserEntryObjects.FormName = JSON.parse(JSON.stringify((lObj.value?.FormData.UserEntryObjects)))
    }
    // alert('outside err')


    mOutPutFormData.FormData.GridData = lObj.value?.FormData.GridData
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
      //debugger
      if (lObj?.status.value === 'success')
        informUser('success', 'Data Deleted sucessfully')
      await btnMoveToList()
    }
  }



  async function btnMoveToList() {
    //debugger
    pageLoading.value = true
    mCurrentFunction.value = 'list'


    await clearListData()

    if (mFormInputData.PageParameters === undefined)
      mFormInputData.PageParameters = { CurrentPage: 1 }
    else
      mFormInputData.PageParameters.CurrentPage = 1

    await listData()
    pageLoading.value = false

  }


  async function btnMoveToCreate() {
    //debugger
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


  async function btnMoveToEdit() {
    //debugger

    // console.log('GetDetailData()', await GetDetailData())
    //debugger

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
      //debugger
      screenDesignStore['_id'] = lTemp._id
      //alert(screenDesignStore.board._id)
    }
    if (currentMaster.value !== 'ScreenConfigure') {
      clearErrors()
      // muserDataStore.data.FormData.UserEntryObjects = Object({})
      muserDataStore.data.FormData.UserEntryObjects.FormName = { ...lTemp }
      //debugger
      console.log('muserDataStore.data.FormData.UserEntryObjects.FormName', muserDataStore.data.FormData.UserEntryObjects.FormName)
    }

    // muserDataStore.data.FormData.UserEntryObjects.FormName = await GetDetailData()

    mCurrentFunction.value = 'edit'
    mErrorOnPage.value = false
  }

  async function btnMoveToSave() {
    console.log(muserDataStore.data.FormData.DataObject)
    //debugger

    const master = currentMaster.value;
    const payload = master === 'ScreenConfigure'
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
    const lObj = await useEmcInsert(master, payload)
    //debugger;
    console.log(lObj?.status.value)
    // let success = lObj?.data.value.success
    let success = lObj?.status.value || lObj?.success
    console.log(success)
    if (success === 'success')
      success = true

    if (success === true) {
      if (lObj?.insertedID)
        muserDataStore.data.FormData.UserEntryObjects.FormName._id = lObj?.insertedID

      await informUser('success', `Data successfully ${lObj?.insertedID ? 'created' : 'updated'}. `)
    } else if (success === false) {
      // alert(lObj?.data.value.insertedID)
      await informUser('error', `${lObj?.insertedID || lObj?.insertedID === undefined ? 'Create' : 'Update'} action Failed ! \n ${lObj?.message}`)
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
  const lPermission = { create: ['delete', 'edit'], edit: ['edit', 'delete', 'create'], save: ['create', 'save', 'list'], list: ['save', 'delete', 'edit'] }

  function disbleButton(vAction) {
    if (vAction === 'delete')
      return !(lPermission[mCurrentFunction.value.toLocaleLowerCase()]?.includes('delete') && (SelectedRows.value?.length > 0 && mCurrentFunction.value.toLocaleLowerCase() === 'list'))

    if (vAction === 'edit' && mCurrentFunction.value === 'list')
      return !(lPermission[mCurrentFunction.value.toLocaleLowerCase()]?.includes('edit') && (SelectedRows.value?.length === 1))

    return lPermission[mCurrentFunction.value.toLocaleLowerCase()]?.includes(vAction)
  }

  const vConfToolbar = [
    { hide: ['delete'], text: 'create', caption: 'Create', icon: 'emcAdd', index: 1, order: 1 },
    { hide: ['create', 'save', 'list'], text: 'save', caption: 'Save', icon: 'emcSave', index: 2, order: 2 },
    { hide: ['save', 'delete'], text: 'list', caption: 'List', icon: 'emcList', index: 3, order: 3 },
    { hide: [], text: 'edit', caption: 'Edit', icon: 'emcEdit', index: 4, order: 4 },
    { hide: [], text: 'delete', caption: 'Delete', icon: 'emcDelete', index: 5, order: 5 },
  ]

  function perforFunction(vAction) {
    switch (vAction) {
      case 'create':
        btnMoveToCreate()
        break
      case 'save':
        btnMoveToSave()
        break
      case 'list':
        btnMoveToList()
        break
      case 'delete':
        btnMoveToDelete()
        break
      case 'edit':
        btnMoveToEdit()
        break;

      // case default:
      //   btnMoveToCreate()
    }
  }

  function clientValidate(vControlName) {

    return [validateField(schema, vControlName)]
  }

  provide('clientErrors', errors)
  provide('clientValidate', clientValidate)


</script>
<template>
  <!-- {{ muserDataStore.data.FormData.UserEntryObjects }} -->
  <!-- {{ mOutPutFormData.FormData.ListHeaders }} -->
  <!-- {{ errors }} -->
  <!-- {{ muserDataStore?.data }} -->
  <!-- {{ muserDataStore.data?.FormData.UserEntryObjects.FormName }} -->
  <!-- <br/> -->
  <!-- {{ muserDataStore.data?.FormData.UserEntryObjects.FormName }} -->
  <!-- <br/> -->
  <!-- <br/> -->
  <!-- {{ mOutPutFormData.FormData.GridData }} -->
  <!-- {{ mFormInputData }}   -->
  <!-- <br/> -->
  <!-- <br/> -->
  <!-- {{ errors }} -->
  <!-- <br/> -->
  <!-- <br/> -->
  <!-- {{ schema }} -->
  <!-- <br/> -->
  <!-- <br/> -->
  <!-- {{mOutPutFormData.FormData.UserEntryObjects }} -->
  <!-- {{ mOutPutFormData.FormData }} -->
  <!-- <hr/> -->
  <!-- <br/> -->

  <!-- {{ mOutPutFormData?.FormData.validationSchema }} -->
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
    <VToolbar style="background-color: transparent;" density="compact" class="ml-2 pa-0">

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
        <VIcon size="18px" color="green" :icon="mFormInputData.searchCriteria.length > 0 ? emcfilter : emcfilteroff">
        </VIcon>
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
            <H2 style="color: maroon;">
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
  <VForm ref="formRef" style="background-color: white;">
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
