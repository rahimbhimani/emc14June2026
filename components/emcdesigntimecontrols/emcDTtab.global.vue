<script setup>
const props = defineProps({
  groupObject: {
    type: Object,
  },
})

const indiTab = ref(0)

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
    if(!indiTab.value)
      indiTab.value=0
    // alert(newValue)
  },
  { deep: true },
)

</script>

<template>
  <VTabs
    v-model="indiTab"
    bg-color="transperant"
  >
    <p
      v-if="props.groupObject?.Controls === undefined || props.groupObject?.Controls.length === 0"
      style="align-content: end;"
      class="ma-0 py-2"
      dense
    >
      No Tabs defined, kindly add a new tab.
    </p>
    <VTab
      v-for="(IndividualTab, index) in props.groupObject.Controls"
      :key="index"
      :value="index"
    >
      <div style="color:grey;padding-inline-end: 11px;">
        {{ IndividualTab.controlProperties.filter(e => e.propertyTitle === 'Title')[0].data }}
      </div>
      <VSpacer />
      <EmcAddMenuToAddToForm :parent-obj="IndividualTab.id" />
    </VTab>
    <VSpacer />
    <EmcAddMenuToAddToForm
      menuforcontrol="Tabs"
      :parent-obj="props.groupObject.id"
    />
  </VTabs>
  
  <VWindow v-model="indiTab">

    <VWindowItem
      v-for="(IndividualTabs, index) in props.groupObject.Controls"
      :key="index"
      :value="index"
    >
    <VContainer class="flex-container wrap ml-0 ">
      <VRow>
          <EmcDTcontrolwithingroups
            :group-object="IndividualTabs.Controls"
            :parent-id="IndividualTabs.id"
          />
      </VRow>
    </VContainer>
    </VWindowItem>
  </VWindow>
</template>
