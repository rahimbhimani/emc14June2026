<script setup>
const props = defineProps({
  groupObject: {
    type: Object,
  },
})

let FormRTObjects = ref()

onMounted(async () => {
  // alert('started')
  debugger
  FormRTObjects.value = await useEmcGetReferenceControlData('ComponentData', { ComponentType: 'RateType', ComponentName: 'FormRateType', IsThisForDesignTime: false })
  FormRTObjects.value.data.FormRTObjects.ComponentInfo = props.groupObject.ComponentInfo
  // alert(FormRTObjects.value.data.FormRTObjects.ComponentInfo)
  console.log(`the component is now mounted.`)
})
</script>

<template>  
    <div class="row-wrapper">
    <VRow class="pl-0 ml-0 pr-0 mr-0 disabled-row">
      <!-- {{ FormRTObjects?.data }} -->
      <EmcRTcontrolwithingroups :group-object="FormRTObjects?.data" />
    </VRow>
  </div>
</template>
