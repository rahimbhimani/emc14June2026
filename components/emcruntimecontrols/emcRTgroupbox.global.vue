<script setup>
const props = defineProps({
  groupObject: {
    type: Object,
  },
  FormParameters: {
    type: Object,
  },
  ParentID: {
    type: Object,
  },
})

const panelValue = ref([''])

onMounted(() => {
  if(props.groupObject.controlProperties?.filter(e => e.propertyTitle === 'Start Expanded'))
    panelValue.value[0] = (props.groupObject.controlProperties.filter(e => e.propertyTitle === 'Start Expanded')[0]?.data === 'true' ? '1' : '')
})
</script>

<template>
  <!-- {{ props.groupObject }} -->
  <VRow
    class="ma-0 pa-0"
    style=" border: 0;background-color: transparent;"
    elevation="0"
  >
    <VCol
      class="ma-0 pa-0"
      style=" border: 0;background-color: transparent;"
      elevation="0"
    >
      <!-- {{ props.groupObject }} -->
      <VExpansionPanels density="compact" elevation="0" v-model="panelValue" multiple class="pa-0 ma-0 my-n3 no-top-line" style="border: 0; background-color: transparent !important;" >
        <VExpansionPanel value="1" style="border: 0; border-color: transparent;" density="compact">
          <VExpansionPanelTitle
            density="compact"
            elevation="0"
            class="pa-0 ma-0 text-body-1"
            style="border: 0; border-color: transparent; background-color: transparent; font-weight: bolder;"
          >
          <div class="mr-4 ma-0 pa-0" style=" background-color: transparent;white-space: nowrap;">
              {{ (props.groupObject.controlProperties?.filter(e => e.propertyTitle === "Title").length === 0 || props.groupObject.controlProperties === undefined ? 'No Group Text defined' : props.groupObject.controlProperties.filter(e => e.propertyTitle === "Title")[0].data).trim() }}
          </div>
            <VDivider
              :thickness="1"
              class="border-opacity-75 ma-0 mp-0"
              style="border-color: gray;"/>
          </VExpansionPanelTitle>
          <VExpansionPanelText elevation="0" density="compact" style=" padding: 0 !important;margin: 0 !important; background-color: transparent;" class="py-1 px-2 text-body-2 no-top-line">
            <VRow class="ma-0 mp-0" >
              <!-- {{ IndividualTab.FormParameters ? '' : IndividualTab.FormParameters = props.FormParameters }} -->
               <div v-show="1===2">{{ props.groupObject.FormParameters ? '' : props.groupObject.FormParameters = props.FormParameters }}</div>
              <EmcRTcontrolwithingroups
                :group-object="props.groupObject"
              />
            </VRow>
          </VExpansionPanelText>
        </VExpansionPanel>
      </VExpansionPanels>
    </VCol>
  </VRow>
</template>

<style>
.flex-container {
  display: flex;
  flex-flow: row wrap;
  justify-content: left !important;
}

.wrap {
  flex-wrap: wrap;
}

.v-toolbar__content {
  block-size: 50px;
}

.flex-item {
  position: relative;
  box-sizing: border-box;
  flex: auto;
  flex-basis: 10%;
  inline-size: 100%;
}

.v-expansion-panel-text__wrapper {
  padding: 0 !important;
  margin: 0 !important;
}

.no-top-line .v-expansion-panel-text {
  border-block-start: none !important;
}
</style>
