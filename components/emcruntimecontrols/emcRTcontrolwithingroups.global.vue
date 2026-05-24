<script setup>
import { string } from 'zod'

const { resolveComponent } = useComponentRegistry()
const props = defineProps({
  groupObject: {
    type: Object,
  },
  vbind1: {
    type: string,
    optional: true,
  },
  inputdata: {
    type: Object,
    optional: true,
  },
})

function getCols(vObject) {
  //debugger
  let lObj

  lObj = vObject.controlProperties?.filter(e => e.propertyTitle === 'Cols')
  if (lObj === null || lObj === undefined || lObj.length === 0)
    return 12

  // alert(lObj[0].data)

  return lObj[0].data
}

const { $resolveAndRenderComponent } = useNuxtApp()

function getControl(vAttribute) {
  return $resolveAndRenderComponent(vAttribute)
}

const getControlswithinData = computed(() => {
  //debugger


  if (props.groupObject === undefined)
    return []
  if (props.groupObject?.FormRTObjects)
    return props.groupObject?.FormRTObjects.Controls

  if (props.groupObject?.Controls)
    return props.groupObject?.Controls

  return []
})


function getControlObject(vControl) {
  if (vControl.controlType === 'Component') {
    //debugger
    vControl.ComponentInfo = vControl.dataPath.replace('FormName.', '')
  }

  if (props.groupObject?.FormRTObjects?.ComponentInfo)
    vControl.ComponentInfo = props.groupObject?.FormRTObjects?.ComponentInfo

  return vControl
}

function getBind(ivbind = {}) {
  return {
    ...ivbind,
    isthisfordialog:
      ivbind.isthisfordialog ||
      (props.vbind1?.isthisfordialog ? 'globeID' : undefined)
  }
}

</script>
<template>
  <!-- {{ groupObject }} -->
  <!-- {{ getControlswithinData }} -->
  <!-- {{ props.groupObject?.FormRTObjects.Controls[0].controlType === 'Component' }} -->
  <!-- {{ getCols(control) }} -->
  <!-- {{ props.groupObject.Controls }} -->
  <!-- {{ props.groupObject.FormRTObjects.Controls }} -->
  <!-- {{ props.groupObject?.FormRTObjects.Controls[0].controlType }} -->
  <!-- {{ props.groupObject?.FormRTObjects.ComponentInfo }} -->
  <VCol class="flex-container wrap pl-0 ml-0 mt-0 pt-0" :cols="12">
    <template v-for="control in getControlswithinData" :key="control.id">
      <VCol class="ml-0 pl-0"
        v-if="control?.controlProperties?.some(p => p.propertyTitle === 'StartOnNextLine' && p.data === 'true')" />

      <VDivider
        v-if="control?.controlProperties?.some(p => p.propertyTitle === 'HorizontalLineBefore' && p.data === 'true')"
        :thickness="1" class="border-opacity-75 mt-2 mb-3 mr-3"></VDivider>
      <!-- {{ control.dataPath }} -->
      <VCol :cols="getCols(control)" class="ma-0 pa-2">
        <!-- {{ control.controlType }} -->
        <!-- {{ props.vbind1?.isthisfordialog }} -->
        <!-- {{ control.vbind }} -->
        <component :is="resolveComponent(control.controlType)" v-model:groupObject="control.Name"
          :FormParameters=props.groupObject.FormParameters :group-object="getControlObject(control)"
          type="control.Datatype" :vbind1="getBind(control.vbind)" :inputdata="props.inputdata" />
      </VCol>

    </template>
  </VCol>
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
