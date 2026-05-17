<script setup>
import { useScreenDesignStore } from '@/store/screenDesignStore'

const screenDesignStore = useScreenDesignStore()

const props = defineProps({
  groupObject: {
    type: Object,
  },
})
let ControlsWithinComponent = ref()
const ComponentType = ref()
const ComponentName = ref()

watch(props.groupObject, async (newValue, oldValue) => {
  // alert('started')
  await getData()
})

onMounted(async () => {
  // alert('started')
  await getData()
})

async function getData() {
  const lObj = props.groupObject.controlProperties.filter(e => e.propertyTitle === 'ComponentType')
  ComponentType.value = lObj ? lObj[0].data.ComponentType : ''
  ComponentName.value = lObj ? lObj[0].data.ComponentName : ''
  // alert('loaded')
  ControlsWithinComponent.value = await useEmcGetReferenceControlData('ScreenConfigure', { ComponentType: ComponentType.value, ComponentName: ComponentName.value, IsThisForDesignTime: true })
  console.log(`the component is now mounted.`)
}

function DeleteControl() {
  // alert(props.groupObject.id)
  screenDesignStore.updateControl(props.groupObject.id, 'NoControl', 'Controls', props.AdditionalPropertiesForControl === undefined ? '' : props.AdditionalPropertiesForControl)
}

</script>

<template>
  <!-- {{ props.groupObject.id }} -->
  <!-- {{ props.groupObject.controlProperties.filter(e=>e.propertyTitle === 'ComponentType') }} -->
  <div class="row-wrapper">
    <VRow class="pl-0 ml-0 pr-0 mr-0 disabled-row">
      <EmcDTcontrolwithingroups :group-object="ControlsWithinComponent?.data" />
    </VRow>
    <VBtn class="delete-btn" :icon="$vuetify.icons.aliases.emcDelete" @click="DeleteControl" density="comfortable"
      color="red" variant="text" />
  </div>
</template>

<style scoped>
.row-wrapper {
  position: relative;
  border: dotted 2px silver;
  padding-block: 5px;
  padding-inline-start: 5px;
}

.delete-btn {
  position: absolute;
  z-index: 1;
  inset-block-start: -8px;
  inset-inline-end: -8px;
}

.disabled-row {
  opacity: 0.5;
  pointer-events: none;
  user-select: none;
}
</style>
