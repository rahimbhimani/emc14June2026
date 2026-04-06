<script setup>
const isThisRunTime = defineModel('isThisRunTime', { default: true })
const loading = defineModel('loading')

// const muserDataStore = defineModel('muserDataStore')
const vmaster = defineModel('vmaster')
let FormData = reactive({ formName: '', InputData: {}, UserEnteredData: {} })
let FormParameters = defineModel('FormParameters')
// const test = ref(null)
async function getControlsData() {
  //debugger
  try {
    // alert('1')
    // test.value = await useEmcGetControlsData(vmaster.value)
    FormData = await useEmcGetControlsData(vmaster.value)
    // alert('2')
    FormParameters.value = FormData[0]?.FormParameters
    // alert('3')
    loading.value = false

    // muserDataStore.value.data.FormData.DataObject = FormData.value !== undefined || FormData.value !== null ? FormData.value.FormRTObjects : ''
  }
  catch (error) {
    // Code to handle the error
    alert("error")
    loading.value = false
  }
  finally {
    // Code that will always run, whether an error occurs or not (optional)
    loading.value = false
  }
}

watch(
  () => loading.value,
  async (newVal) => {
    if (newVal) {
      await getControlsData()
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await getControlsData()

  // await $nextTick() // Wait for children to render in the DOM
  loading.value = false // Stop loader
})

// onUpdated(() => {
//   // loading.value = true
//   loading.value = false
// })
</script>

<template>
  <!-- RAHIM I am here -->

  <VCol v-if="FormData" class="pa-2" style="background-color: transparent;">
    <!-- {{ loading }} -->
    <VSkeletonLoader type="table-row-divider, table-tbody" :loading="loading" style="background-color: transparent;">

      <!-- {{ FormData[0] }} -->
      <EmcRTcontrolwithingroups :group-object="FormData[0]" />
    </VSkeletonLoader>
  </VCol>
</template>
