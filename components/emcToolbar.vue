<script setup lang="ts">
import { useScreenDesignStore } from '@/store/screenDesignStore'
import { userDataStore } from '@/store/userDataStore'

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
const isConfirmDialogVisible = ref(false)

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
  debugger
  if (newRoute.toLowerCase().includes('emclist')) {
    IsthisFirstServerRequest.value = true
    mFormInputData.searchCriteria = {}
    clearListData()
    btnMoveToList()
  }
  else if (newRoute.toLowerCase().includes('emccreate')) {
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
  debugger
  mCurrentFunction.value = 'edit'

  mErrorOnPage.value = false


  mFormInputData.data = [{ _id: SelectedRows.value[0]._id }]
  alert(mFormInputData.data)
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
  debugger

  console.log(lObj)

  console.log('consolesdsdfsdf', lObj.value.FormData.error)
  if (lObj.value.FormData.error.errorCode !== '') {
    mErrorOnPage.value = true

    return
  }

  if (IsthisFirstServerRequest.value === true)
    mOutPutFormData.FormData.ListHeaders = lObj.value?.FormData.ListHeaders

  // alert('outside err')
  mOutPutFormData.FormData.GridData = lObj.value?.FormData.GridData
  mFormInputData.PageParameters.TotalRecordCount = lObj.value?.FormData.PaginationOutPutData.TotalRecordCount
  mFormInputData.PageParameters.TotalPages = lObj.value?.FormData.PaginationOutPutData.TotalPages
  mFormInputData.PageParameters.Limit = lObj.value?.FormData.PaginationOutPutData.Limit
  IsthisFirstServerRequest.value = false
}

onMounted(async () => {
  // alert(route.path)
  if (route.path.toLowerCase().includes('emclist')) {
    IsthisFirstServerRequest.value = true
    SelectedRows.value = []
    await clearListData()
    await btnMoveToList()
  }
  else if (route.path.toLowerCase().includes('emccreate')) {
    // listData()
  }
})

async function btnMoveToDelete() {
  isConfirmDialogVisible.value = true
}

async function handleDelete(vBool) {
  if (vBool === true) {
    const lObj = await useEmcDelete(currentMaster.value, SelectedRows.value)
    debugger
    if (lObj?.status.value === 'success')
      informUser('success', 'Data Deleted sucessfully')
    await btnMoveToList()
  }
}

async function btnMoveToList() {
  debugger
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
  debugger
  pageLoading.value = true
  if (currentMaster.value === 'ScreenConfigure') {
    // muserDataStore.data.FormData = Object({})
    muserDataStore.data.FormData.DataObject = Object({})
    screenDesignStore.board = []
  }

  if (currentMaster.value !== 'ScreenConfigure') {
    muserDataStore.data.FormData.UserEntryObjects = Object({})
    muserDataStore.data.FormData.UserEntryObjects.FormName = Object({})
  }

  // muserDataStore.data.FormData.DataObject = Object({})
  mFormInputData.data = Object({})
  mCurrentFunction.value = 'create'
  mErrorOnPage.value = false

  // pageLoading.value = false

  // alert(mCurrentFunction.value)
}

async function btnMoveToEdit() {
  debugger

  // console.log('GetDetailData()', await GetDetailData())

  const lTemp = await GetDetailData()

  pageLoading.value = true

  // muserDataStore.data.FormData = Object({})
  // mFormInputData.data = Object({})
  if (currentMaster.value === 'ScreenConfigure') {
    muserDataStore.data.FormData = Object({})
    muserDataStore.data.FormData.DataObject = { ...lTemp.FormDTObjects }
    screenDesignStore.board = lTemp.FormDTObjects.board
  }
  if (currentMaster.value !== 'ScreenConfigure') {
    muserDataStore.data.FormData.UserEntryObjects = Object({})
    muserDataStore.data.FormData.UserEntryObjects.FormName = { ...await GetDetailData() }
  }

  // muserDataStore.data.FormData.UserEntryObjects.FormName = await GetDetailData()

  mCurrentFunction.value = 'edit'
  mErrorOnPage.value = false
}

async function btnMoveToSave() {
  debugger
  console.log('btnMoveToSave', muserDataStore.data.FormData.DataObject)

  // const { valid } = formRef.value.validate() // Validate form

  const lObj = await useEmcInsert(currentMaster.value, currentMaster.value === 'ScreenConfigure' ? screenDesignStore : muserDataStore.data?.FormData.UserEntryObjects.FormName)

  if (lObj?.status.value === 'success')
    informUser('success', 'Data Created sucessfully')

  if (lObj?.status.value !== 'success')
    informUser('error', 'Oops something weent wrong')
}

function informUser(vShow, vMessage) {
  // alert(vState)
  if (vShow === 'success') {
    // alert('rahim')
    isSnackbarVisible.show = true
    isSnackbarVisible.error = false
    isSnackbarVisible.message = vMessage
  }
  if (vShow === 'Failed') {
    // alert('rahim11')
    isSnackbarVisible.show = false
    isSnackbarVisible.error = true
    isSnackbarVisible.message = vMessage
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
  { hide: ['delete'], text: 'create', caption: 'Create', icon: 'emcadd', index: 1, order: 1 },
  {
    hide: ['create', 'save', 'list'], text: 'save', caption: 'Save', icon: 'emcsave', index: 2, order: 2,
    children: [
      { text: 'create_new', caption: 'Create New', icon: 'emcadd' },
      { text: 'copy', caption: 'Copy', icon: 'mdi:content-copy' },
      { text: 'excel_load', caption: 'Excel Load', icon: 'mdi:file-excel' },
      { text: 'template', caption: 'Template', icon: 'mdi:file-download' },
    ]
  },
  { hide: ['save', 'delete'], text: 'list', caption: 'List', icon: 'emclist', index: 3, order: 3 },
  { hide: [], text: 'edit', caption: 'Edit', icon: 'emcedit', index: 4, order: 4 },
  { hide: [], text: 'delete', caption: 'Delete', icon: 'emcdelete', index: 5, order: 5 },
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
</script>

<template>

  <!-- {{ muserDataStore }} -->
  <!-- {{ muserDataStore }} -->
  <!--   
    {{ currentMaster }}
    {{ muserDataStore.data.FormData.UserEntryObjects }}
  -->

  <!-- {{ currentMaster }} -->
  <ConfirmAction v-model:isDialogVisible="isConfirmDialogVisible"
    confirmation-question="Selected records will be deleted, do you wish to continue ?"
    cancel-msg="Unsubscription Cancelled!!" cancel-title="Cancelled"
    confirm-msg="Your subscription cancelled successfully." confirm-title="Unsubscribed!" @confirm="handleDelete" />
  <VToolbar style="background-color: transparent;" density="compact" class="pa-0 ma-0">
    <VBtn v-for="inividualControl in vConfToolbar.sort((firstItem, secondItem) => firstItem.order - secondItem.order)"
      :key="inividualControl.index" color="#5865f2" density="comfortable"
      :disabled="pageLoading === true ? true : disbleButton(inividualControl.text)"
      @click="perforFunction(inividualControl.text)">
      <template #prepend>
        <VIcon icon="ri-add-line" />
        <!-- <VIcon :icon="image1"></VIcon> -->
      </template>
      <h5 style="font-weight: normal;">
        {{ inividualControl.caption }}
      </h5>
    </VBtn>

    <VSpacer />

    <VBtn :color="mFormInputData.searchCriteria?.length > 0 ? '#008000' : 'red'"
      @click="filterpanelexpanded = !filterpanelexpanded">
      <VIcon size="18px" color="green">
        {{ mFormInputData.searchCriteria.length > 0 ? $vuetify.icons.aliases.emcfilter :
          $vuetify.icons.aliases.emcfilteroff
        }}
      </VIcon>
    </VBtn>
  </VToolbar>
  <div v-if="mErrorOnPage === true"
    style="display: flex;align-items: center; justify-content: center; block-size: 300px; inline-size: 100%;">
    <VContainer>
      <VRow no-gutters justify="center" style="display: flex;align-items: center; justify-content: center;">
        <VCol
          style="display: flex;align-items: center; justify-content: center; background-color: transparent; color: transparent;">
          <VBtn style="background-color: transparent !important;">
            <VIcon size="18px" style="background-color: red;" class="mr-4">
              {{ $vuetify.icons.aliases.emcdelete }}
            </VIcon>
            <H2 style="color: maroon;">
              Error In Configuration
            </H2>
          </VBtn>
        </VCol>
      </VRow>
    </VContainer>
  </div>

  <div v-if="mCurrentFunction === 'list' && currentMaster !== '' && mOutPutFormData.FormData !== undefined"
    class="ma-0 pa-0">

    <div v-show="filterpanelexpanded === true">
      <div v-show="mErrorOnPage === false">
        <EmcSearchbar v-model:outputSearchCriteria="mFormInputData.searchCriteria"
          v-model:filterpanelexpanded="filterpanelexpanded" v-model:loading="pageLoading" />
      </div>
    </div>
  </div>

  <div>

    <component :is="getControl(mCurrentFunction)" v-model:vmaster="currentMaster"
      v-model:PaginationParameters="mFormInputData.PageParameters" v-model:SelectedRows="SelectedRows"
      v-model:dataObject="muserDataStore.data.FormData.DataObject" v-model:loading="pageLoading"
      :OutputDataForList="mErrorOnPage === true ? null : mOutPutFormData.FormData.GridData"
      :ListHeaders="mErrorOnPage === true ? null : mOutPutFormData.FormData.ListHeaders" @selectionchanged="listData" />
  </div>
  <!-- </NuxtPage> -->
  <VSnackbar v-model="isSnackbarVisible.show" location="top center"
    :color="isSnackbarVisible.error !== false ? 'error' : 'success'" variant="elevated" :timeout="2000"
    density="compact">
    <div style="text-align: center;">
      {{ isSnackbarVisible.message }}
    </div>
  </vsnackbar>
</template>
