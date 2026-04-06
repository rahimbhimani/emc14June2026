<script setup>

const props = defineProps({
  groupObject: {
    type: Object,
  },
  FormParameters: {
    type: Object,
  },
})

const indiTab = ref(null)

watch(
  () => ({ ...props.groupObject.Tabs }),
  (newValue, oldValue) => {
    // Note: `newValue` will be equal to `oldValue` here
    // *unless* state.someObject has been replaced

    debugger
    console.log('New Value', newValue)
    console.log('old Value', oldValue)
    console.log('NewValue', newValue.length, 'old value', oldValue.length)

    // alert(props.groupObject.Tabs.length)

    indiTab.value = props.groupObject.Tabs === undefined ? null : props.groupObject.Tabs.length <= 0 ? null : Object.keys(newValue).length !== Object.keys(oldValue).length ? Object.keys(newValue).length + (Object.keys(newValue).length > Object.keys(oldValue).length ? -1 : -1) : indiTab.value
    if (!indiTab.value)
      indiTab.value = 0
    // alert(newValue)
  },
  { deep: true },
)
</script>

<template>
  <VTabs v-model="indiTab" class="px-0 mb-2">
    <p v-if="props.groupObject?.Controls === undefined || props.groupObject?.Controls.length === 0"
      style="align-content: end;" class="ma-0 py-2" dense>
      No Tabs defined, kindly add a new tab.
    </p>
    <VTab v-for="(IndividualTab, index) in props.groupObject.Controls" :key="index" :value="index">
      <span class="emc-tab-title">
        {{IndividualTab.controlProperties.filter(e => e.propertyTitle === 'Title')[0].data}}
      </span>
    </VTab>
  </VTabs>
  <VWindow v-model="indiTab" class="mx-0 px-0">
    <VWindowItem v-for="(IndividualTab, index) in props.groupObject.Controls" :key="index" :value="index"
      style="background-color: transparent;">
      {{ IndividualTab.FormParameters ? '' : IndividualTab.FormParameters = props.FormParameters }}
      <!-- <VContainer class="flex-container wrap ml-0 "> -->
      <VCol class="flex-container wrap ma-0 pa-0" cols="12">
        <EmcRTcontrolwithingroups :group-object="IndividualTab" />
      </VCol>
      <!-- </VContainer> -->
    </VWindowItem>
  </VWindow>
</template>
<style>
/* remove tab button padding + min width */
.emc-tab {
  min-inline-size: auto !important;
  padding-inline: 6px !important;
}

/* also remove extra space inside button content */
.emc-tab .v-btn__content {
  padding: 0 !important;
  margin: 0 !important;
}

/* text styling */
.emc-tab-title {
  padding: 0 !important;
  margin: 0 !important;
  color: grey;
  white-space: nowrap;
}
</style>
