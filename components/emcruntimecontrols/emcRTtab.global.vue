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
      <div style="color: grey;padding-inline-end: 11px;">
        {{ IndividualTab.controlProperties.filter(e => e.propertyTitle === 'Title')[0].data }}
      </div>
    </VTab>
  </VTabs>
  <VWindow v-model="indiTab">
    <VWindowItem
      v-for="(IndividualTab, index) in props.groupObject.Controls"
      :key="index"
      :value="index"
    >
    {{ IndividualTab.FormParameters ? '' : IndividualTab.FormParameters = props.FormParameters }}
      <!-- <VContainer class="flex-container wrap ml-0 "> -->
        <VRow class="flex-container wrap ml-0 mt-1" >
          <EmcRTcontrolwithingroups :group-object="IndividualTab"  />
        </VRow>
      <!-- </VContainer> -->
    </VWindowItem>
  </VWindow>
</template>
