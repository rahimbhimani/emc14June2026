<script setup>
import { onMounted, ref } from 'vue'

const props = defineProps({
  groupObject: { type: Object },
  FormParameters: { type: Object },
  ParentID: { type: Object },
})

const panelValue = ref([''])

onMounted(() => {
  if (props.groupObject.controlProperties?.filter(e => e.propertyTitle === 'Start Expanded')) {
    panelValue.value[0] =
      props.groupObject.controlProperties.filter(e => e.propertyTitle === 'Start Expanded')[0]?.data === 'true'
        ? '1'
        : ''
  }
})
</script>

<template>
  <VCol class="ma-0 pa-0" style="border: 0; background-color: transparent;">
    <VExpansionPanels density="compact" elevation="7" v-model="panelValue" multiple class="pa-0 ma-0 my-n1 no-top-line"
      style="background-color: transparent !important;">
      <VExpansionPanel value="1" style="border: 0;" density="compact">
        <VExpansionPanelTitle density="compact" elevation="0" class="text-body-1"
          style="border: 0; background-color: transparent; font-weight: bolder;">
          <div style="background-color: transparent; white-space: nowrap;">
            {{
              (
                props.groupObject.controlProperties?.filter(e => e.propertyTitle === 'Title').length === 0 ||
                  props.groupObject.controlProperties === undefined
                  ? 'No Group Text defined'
                  : props.groupObject.controlProperties.filter(e => e.propertyTitle === 'Title')[0].data
              ).trim()
            }}
          </div>

          <VDivider :thickness="1" class="border-opacity-75 ma-0 mp-0" />
        </VExpansionPanelTitle>

        <VExpansionPanelText elevation="0" density="compact" class="py-1 px-2 text-body-2 no-top-line"
          style="padding: 0 !important; margin: 0 !important; background-color: transparent;">
          <VRow class="ma-0 pa-0" align="start">
            <VCol cols="12" class="ma-0 pa-0">
              <EmcRTcontrolwithingroups :group-object="props.groupObject" :FormParameters="props.FormParameters" />
            </VCol>
          </VRow>
        </VExpansionPanelText>
      </VExpansionPanel>
    </VExpansionPanels>
  </VCol>
</template>

<style>
.v-expansion-panel-text__wrapper {
  padding: 0 !important;
  margin: 0 !important;
}

.no-top-line .v-expansion-panel-text {
  border-block-start: none !important;
}
</style>
