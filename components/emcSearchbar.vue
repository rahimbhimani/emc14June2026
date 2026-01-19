<script setup>
const props = defineProps({
  searchAttributes: {
    type: Object,
  },
})
// const searchAttributes = defineModel('searchAttributes')// [{ name: 'Code', DBName: 'Code', datatype: 'string' }, { name: 'Description', DBName: 'Description', datatype: 'string' }, { name: 'Counter', DBName: 'Counter', datatype: 'number' }]
const searchConditions = [{ dataType: 'string', supportedConditions: ['Like', 'Contains', 'Equals', 'Not Equals'] }, { dataType: 'number', supportedConditions: ['Equals', 'Not Equals', 'Greater Than', 'Greater Than Equal', 'Less Than', 'Less Than Equal'] }]
const searchUserSelectionOrData = ref()
const editIndex = ref(-1)
const filterpanelexpanded = defineModel('filterpanelexpanded')
const searchObjectAttribute = ref(null)
const userEntredListData = ref('')
const listviewmode = defineModel('listviewmode')
const loading = defineModel('loading')
// eslint-disable-next-line prefer-const
let searchObjectCondition = ref(null)

const outputSearchCriteria = defineModel('outputSearchCriteria')
const searchObjectsForFilter = reactive([])

onMounted(() => {
  if (outputSearchCriteria?.value.length > 0) {
    outputSearchCriteria.value.forEach(element => {
      searchObjectsForFilter.push(element)
    })
  }
})

function clearSearchCriteria() {
  searchObjectAttribute.value = null
  searchObjectCondition.value = null
  searchUserSelectionOrData.value = null

  editIndex.value = -1
}

function btnaddSearchCritria() {
  if (searchObjectAttribute.value === null || searchObjectCondition.value === null || (searchUserSelectionOrData.value === null || searchUserSelectionOrData.value === '')) {
    alert('Cannot have this empty')

    return
  }

  const lObj = new Object()

  lObj.Attribute = searchObjectAttribute.value
  lObj.Condition = searchObjectCondition.value
  lObj.Input = searchUserSelectionOrData.value
  if (editIndex.value === -1)
    searchObjectsForFilter.push(lObj)

  else
    searchObjectsForFilter[editIndex.value] = lObj

  clearSearchCriteria()
  outputSearchCriteria.value = searchObjectsForFilter
}
function btndeleteSearchCritria(vIndex) {

  // console.log('iteamdeleted',searchObjectsForFilter.splice(vIndex, 1))
  outputSearchCriteria.value.splice(vIndex, 1)
}

function btneditSearchCritria(vIndex) {
  filterpanelexpanded.value = true
  searchObjectAttribute.value = searchObjectsForFilter.filter((item, index) => index === vIndex)[0].Attribute
  searchObjectCondition.value = searchObjectsForFilter.filter((item, index) => index === vIndex)[0].Condition
  searchUserSelectionOrData.value = searchObjectsForFilter.filter((item, index) => index === vIndex)[0].Input
  editIndex.value = vIndex
}
</script>

<template>
  <!-- {{searchObjectsForFilter}}  -->
  <!-- {{outputSearchCriteria}} -->
  <VSkeletonLoader
    type="table-heading"
    :loading="loading"
    style=" background-color: transparent;"
  >
    <VRow
      v-show="searchObjectsForFilter.length > 0"
      class="ma-0 pa-1"
      density="compact"
      dense
      style=" background-color: transparent;inline-size: 100%;"
    >
      <VCol cols="11" density="compact">
        <VContainer
          v-show="searchObjectsForFilter.length > 0"
          fluid
          density="compact"
          justify="start"
          :class="searchObjectsForFilter.length > 0 ? 'd-flex flex-wrap ga-1 ma-0 mt-2 pt-1 pb-1 px-3' : 'd-flex flex-wrap ma-0 pt-0 pb-0'"
        >
          <VRow
            density="compact"
            class="d-flex ga-1"
          >
            <VChip
              v-for="(searchChip, index) in searchObjectsForFilter"
              :key="index"
              :disabled="editIndex !== -1 ? editIndex === index ? false : true : false"
              density="compact"
              elevation="2"
            >
              <VIcon
                size="14px"
                start
                elevation="2"
                icon="emcFilter"
              >
              </VIcon>
              {{ searchChip.Attribute?.name }} {{ searchChip.Condition }} {{ searchChip.Input }}
              <VIcon
                size="16px"
                end
                @click="btneditSearchCritria(index)"
                icon="emcEdit"
              >
              </VIcon>
              <VIcon
                size="16px"
                end
                @click="btndeleteSearchCritria(index)"
                icon="emcDelete"
              >
              </VIcon>
            </VChip>
          </VRow>
        </VContainer>
      </VCol>
      <VSpacer />
      <VCol
        v-show="searchObjectsForFilter.length > 0"
        cols="auto"
        align-self="center"
      >
        <VIcon
          size="16px"
          end
          @click="searchObjectsForFilter.splice(0, searchObjectsForFilter.length); outputSearchCriteria.splice(0, outputSearchCriteria.length)"
          icon="emcDelete"
        >
        </VIcon>
      </VCol>
    </VRow>
    
    <VRow
      :class="searchObjectsForFilter.length > 0 ? 'ma-0 mt-0 pa-0 pb-1' : 'ma-0 pt-2 pb-1'"
      density="compact"
      align="start"
      align-content="start"
    >
      <VContainer
        fluid
        class="d-flex flex-wrap ma-0 pa-0"
        density="compact"
      >
        <VRow
          justify="start"
          class="ma-0 pa-0"
          density="compact"
          dense
        >
          <VCol
            density="compact"
            cols="2"
          >
            <VSelect
              v-model="searchObjectAttribute"
              :items="props.searchAttributes"
              item-title="name"
              label="Select Attribute"
              return-object
              single-line
              density="compact"
            />
          </VCol>
          <VCol cols="2">
            <VSelect
              v-model="searchObjectCondition"
              :items="searchObjectAttribute === null ? searchConditions[0].supportedConditions : searchConditions.filter(e => e.dataType === searchObjectAttribute?.datatype)[0].supportedConditions"
              label="Select condition"
              return-object
              single-line
              density="compact"
            />
          </VCol>
          <VCol cols="3">
            <VTextField
              v-model="searchUserSelectionOrData"
              density="compact"
            />
          </VCol>
          <VCol cols="auto">
            <VBtn
              density="default"
              color="transperant"
              @click="btnaddSearchCritria"
            >
              <VIcon :icon="editIndex === -1 ? 'emcAdd' : 'emcSave'">
              </VIcon>
            </VBtn>
          </VCol>
          <VCol cols="auto">
            <VBtn
              :disabled="editIndex === -1"
              density="default"
              color="transperant"
              @click="clearSearchCriteria"
            >
              <VIcon color="black" icon="emcUndo">
              </VIcon>
            </VBtn>
          </VCol>
<VSpacer />
<VBtnGroup class="pt-2" density="compact" variant="tonal" >
  <VBtn
    icon
    :color="listviewmode === 'table' ? 'primary' : undefined"
    @click="listviewmode = 'table'"
  >
  <VIcon size="20" icon="ri-table-line" ></VIcon>
  </VBtn>
  <VBtn
    icon
    :color="listviewmode === 'card' ? 'primary' : undefined"
    @click="listviewmode = 'card'"
  >
    <v-icon size="20" icon="ri-grid-line"></v-icon>
  </VBtn>
</VBtnGroup>



          <VSpacer />

          <VCol cols="2">
            <VCombobox
              v-model="userEntredListData"
              :items="props.searchAttributes"
              item-title="name"
              label="Saved Filters"
              return-object
              single-line
              density="compact"
            />
          </VCol>
          <VCol cols="auto">
            <VBtn
              :disabled="searchObjectsForFilter?.length === 0"
              density="default"
              color="transperant"
              @click="clearSearchCriteria"
            >
              <VIcon color="black" icon="emcSave">
              </VIcon>
            </VBtn>
          </VCol>
        </VRow>
      </VContainer>
    </VRow>
  </VSkeletonLoader>
</template>

