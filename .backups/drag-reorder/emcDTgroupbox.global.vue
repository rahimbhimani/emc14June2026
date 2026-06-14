<script setup>
const props = defineProps({
  groupObject: {
    type: Object,
  },
  ParentID: {
    type: Object,
  },
})
let panelValue = ref([''])

onMounted(() => {
  panelValue.value[0] = (props.groupObject.controlProperties.filter(e => e.propertyTitle === 'Start Expanded')[0]?.data === true ? '1' : '')
})

</script>

<template>
  <VRow
    dense
    class="ma-0 pa-0"
    style="background-color:transparent"
  >
    <VCol
      dense
      class="ma-0 pa-0"
      style="
    background-color:transparent"
    >
      <!-- {{ props.groupObject }} -->
      <VExpansionPanels 
      v-model="panelValue" multiple>
        <VExpansionPanel  value="1" density="compact">
          <VExpansionPanelTitle
            density="compact"
            style="background-color:lightblue;block-size: 5px;"
          >
            <div style="color:black">
              {{ props.groupObject.controlProperties.filter(e => e.propertyTitle === "Title")[0].data }}
            </div>
            <VSpacer />
            <EmcAddMenuToAddToForm :parent-obj="props.groupObject.id" />
          </VExpansionPanelTitle>
          <VExpansionPanelText>
            <VContainer class="flex-container wrap">
              <VRow>
                <EmcDTcontrolwithingroups
                  :group-object="props.groupObject.Controls"
                  :ParentID="larrParents"
                  style="background-color: yellow"
                />
              </VRow>
            </VContainer>
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
  justify-content: left!important;
}

.wrap {
  flex-wrap: wrap;
}

.v-toolbar__content{
  block-size: 50px;
}

.flex-item {
  position: relative;
  box-sizing: border-box;
  flex: auto;
  flex-basis: 10%;
  inline-size: 100%;
}
</style>
