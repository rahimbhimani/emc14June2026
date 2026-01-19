<script setup>
  const { resolveComponent } = useComponentRegistry()
const props = defineProps({
  groupObject: {
    type: Object,
  },
})

function getCols(vObject) {
  debugger
  let lObj

  lObj = vObject.controlProperties.filter(e => e.propertyTitle === 'Cols')[0]

  return lObj.ChangedBy === '' || lObj.ChangedBy === undefined ? lObj.Defaultvalue : lObj.data
}

// const { $resolveAndRenderComponent } = useNuxtApp()

// function getControl(vAttribute) {
//   return $resolveAndRenderComponent(vAttribute, false)
// }
</script>

<template>
  <!-- {{ props.groupObject }} -->
  <template v-for="(control) in props.groupObject" :key="control.id">
    <!-- {{ control.controlProperties }} -->
    <VCol
      v-if="control.controlProperties?.some(p => p.propertyTitle === 'StartOnNextLine' && p.data === 'true')"
      style="flex-basis: 100%; padding: 0; block-size: 0;"
    />
    <VDivider
      v-if="control.controlProperties?.some(p => p.propertyTitle === 'HorizontalLineBefore' && p.data === 'true')"
      :thickness="2"
      class="border-opacity-75 mt-1 mb-1"
      style="border-color: silver;"
    />
    <!-- {{ control }} -->
    <VCol
    :cols="getCols(control)"
    class="pl-0 ml-0"
    >  
    <component
      :is="resolveComponent(control.controlType, true)"
      :group-object="control"
      type="control.Datatype"
      v-bind="control.vbind"
    />
  </VCol>

</template>
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
</style>
