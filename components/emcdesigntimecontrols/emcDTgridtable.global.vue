<script setup>
import { useScreenDesignStore } from '@/store/screenDesignStore'
const { resolveComponent } = useComponentRegistry()
const props = defineProps({
  groupObject: {
    type: Object,
  },
  ParentID: {
    type: Object,
  },
})

const screenDesignStore = useScreenDesignStore()

const larrParents = ref([])

// Watch for changes in props.myProp
// watch(() => props.groupObject, (newValue, oldValue) => {
//   // React to prop changes
//   debugger
//   setParentIds()
// })
// function setParentIds() {
//   debugger
//   larrParents = []
//   props.ParentID.forEach(element => {
//     larrParents.push(Object.assign({}, element))
//   })

//   larrParents.push({ Controls: props.groupObject.id })
// }

// onMounted(async () => {
//   debugger

//   // setParentIds()
// })

// const { $resolveAndRenderComponent } = useNuxtApp()

// function getControl(vAttribute) {
//   // return $resolveAndRenderComponent(vAttribute)
//   return $resolveAndRenderComponent(vAttribute, false)
// }

const items = [
  { },
]

function getColumnsAttrs() {
  debugger
  const lObj = []

  props.groupObject.Controls.forEach(elementColumns => {
    elementColumns.vbind ? lObj.push(elementColumns.vbind) : lObj.push({ title: 'No Header', width: '25px' })
  })

  return lObj
}

function addNewGridColumn() {
  debugger
  screenDesignStore.addControl(props.groupObject.id, 'NoControl', 'Controls', 'GridHeader')
}

function DeleteControl() {
  debugger
  screenDesignStore.deleteControl(props.groupObject.id, '', 'Controls', '')
}
</script>

<template>
  <div style=" border: 2px solid;background-color: silver;">
    <!-- {{ groupObject }} -->
    <VToolbar
      border="true"
      density="compact"
      title="Grid Management"
    >
      <div style="color: black;">
        <!-- {{ props.groupObject.controlProperties.filter(e => e.propertyTitle === "Title")[0].data }} -->
      </div>
      <VSpacer />
      <EmcAddMenuToAddToForm :parent-obj="props.groupObject.id" />
    </VToolbar>
    <!-- {{groupObject}} -->
    <!-- {{props.groupObject.Controls}} -->
    <!-- {{props.groupObject.Controls}} -->
    <VDataTable
      :items="items"
      :headers="getColumnsAttrs()"
      class="custom-header-style"
    >
      <template #item>
        <tr>
          <!-- {{props.groupObject}} -->
          <td
            v-for="(header, index) in props.groupObject.Controls"
            :key="index"
          >
            <component
              :is="resolveComponent(header.controlType, true)"
              :group-object="header"
              AdditionalPropertiesForControl="GridHeader"
              :ParentID="larrParents"
              v-bind="header.vbind"
            />
          </td>
        </tr>
      </template>
      <!-- {{headers}} -->
      <template
        v-if="props.groupObject.controlProperties.filter(e => e.propertyTitle === 'hide-footer')[0].data.value === 'false'"
        #bottom
      />
    </VDataTable>

  <!--
    <v-data-table :items="items" :headers="getColumnsAttrs()">

    </v-data-table>
  -->
  </div>
</template>

<style>
.custom-header-style .v-table__wrapper th {
  font-size: 16px; /* Adjust the font size as needed */
}

.custom-header-style .v-data-footer {
  display: none;
}
</style>
