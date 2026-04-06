<script setup>
import { useScreenDesignStore } from '@/store/screenDesignStore'

const props = defineProps({
  groupObject: {
    type: Object,
  },
  AdditionalPropertiesForControl: '',
})

const screenDesignStore = useScreenDesignStore()
const controlSelected = ref('Select Control')
const subcontrolSelected = ref('Select Control')
const subsubcontrolSelected = ref('Select Control')

watch(

  () => controlSelected.value,
  (newValue, oldValue) => {
    debugger
    // alert('start')
    if (newValue === null)
      controlSelected.value = 'Select Control'
    if (newValue !== 'Select Control'){
      // alert('start')
      updateControl(newValue)
    }
  }
)

const dialog = ref(false)

function updateControl(vValue) {
  debugger
  // if(controlSelected.value === 'Component'){
  //   dialog.value= true
  //   return
  // }
  screenDesignStore.updateControl(props.groupObject.id, vValue, 'Controls', props.AdditionalPropertiesForControl === undefined ? '' : props.AdditionalPropertiesForControl)
}

function CreateComponent() {
  //validate control
  debugger
  screenDesignStore.updateControl(props.groupObject.id, controlSelected.value, 'Controls', { ComponentType: subcontrolSelected.value, ComponentName: subsubcontrolSelected.value })
}

function ClearClicked() {
  screenDesignStore.deleteControl(props.groupObject.id, '', 'Controls', props.AdditionalPropertiesForControl === undefined ? '' : props.AdditionalPropertiesForControl)
}

const items = ['Select Control', 'TextBox', 'Pricing', 'GridTable', 'GroupData', 'DropDown', 'DataTable', 'Component', 'RateDefinition', 'Image']

const componentItems = ['FormContainer', 'ControlContainer', 'RateType', 'RateCondition']

const filteredControls = computed(() => {
  // const match = Object//= await useEmcList(currentMaster.value, mFormInputData, IsthisFirstServerRequest.value)
  return componentItems //match ? componentItems : []
})
</script>

<template>

  <div style="align-object: left;">
    <VSelect
      v-model="controlSelected"
      :items="items"
      single-line
      label="Select Control"
      density="comfortable"
      :prepend-inner-icon="controlSelected === 'Select Control' || controlSelected === '' ? '' : 'mdi:wrench'"
      clearable
      :post-icon="controlSelected === 'Select Control' || controlSelected === '' ? '' : 'mdi:wrench11'"
      @click:clear="ClearClicked"
    />
  </div>
</template>
