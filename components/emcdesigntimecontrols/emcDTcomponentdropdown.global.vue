<script setup>
const selectedcontrol = ref( { ComponentType: null } )
const selectedChildcontrol = ref({ ComponentName: null } )
const childComponents = ref([])
const emit = defineEmits(['updateObject'])
const props = defineProps(['componentobject'])

async function handleChange() {
  // alert('rahim')
  debugger
  childComponents.value = []
  selectedChildcontrol.value = {}
  const lObj = await useEmcGetReferenceControlData('ScreenConfigure', {ComponentType: selectedcontrol.value.ComponentType, Component: selectedChildcontrol.value.ComponentName , IsThisForDesignTime: true})
  console.log('handleChange', lObj.data.value)
  childComponents.value = lObj.data.value
}

async function handleChildChange() {
    if (selectedChildcontrol.value.ComponentName){
    // alert(selectedChildcontrol.value.ComponentName)
      emit('updateObject', {ComponentType: selectedcontrol.value.ComponentType, ComponentName: selectedChildcontrol.value.ComponentName , IsThisForDesignTime: true})
  }
  }
      

onMounted(async () => {
  selectedcontrol.value.ComponentType = props.componentobject.ComponentType
  
  const lObj = await useEmcGetReferenceControlData('ScreenConfigure', {ComponentType: selectedcontrol.value.ComponentType, ComponentName: undefined, IsThisForDesignTime: true })

  childComponents.value = lObj.data.value
  selectedChildcontrol.value.ComponentName = props.componentobject.ComponentName
})

const componentItems = ['FormContainer', 'ControlContainer', 'RateType', 'RateCondition', 'RateDefinition']

</script>

<template>
<!-- {{ props.componentobject }} -->
  <VSelect
      v-model="selectedcontrol.ComponentType"
      class="mb-2"
      :items="componentItems"
      single-line
      label="Select Control"
      density="comfortable"
      @update:modelValue="handleChange"
    />
    <!-- {{ selectedChildcontrol.ComponentName }} -->
    <VSelect
      v-model="selectedChildcontrol.ComponentName"
      :items="childComponents"
      :item-title="item => item.FormParameters.Name"
      label="Select Control"
      density="comfortable"
      @update:modelValue="handleChildChange"
    />

</template>
