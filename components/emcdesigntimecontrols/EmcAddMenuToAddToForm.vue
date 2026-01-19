<script setup>
import { useScreenDesignStore } from '@/store/screenDesignStore'

const props = defineProps({
  parentObj: {
    type: Object,
  },
  AdditionalPropertiesForControl: {
    type: Object,
    default: '',
  },
  menuforcontrol: { default: 'all', type: String },
})

const screenDesignStore = useScreenDesignStore()

const items = [
  { title: 'Control', ControlType: 'NoControl', controlfor: 'all' },
  { title: 'Tab', ControlType: 'Tab', controlfor: 'all' },
  { title: 'Grid', ControlType: 'GridTable', controlfor: 'all' },
  { title: 'GroupBox', ControlType: 'GroupBox', controlfor: 'all' },
  { title: 'Tab Control', ControlType: 'Tabs', controlfor: 'Tabs' },
]

function PerformAction(vItem) {
  debugger
  screenDesignStore.addGenericControl(props.parentObj === undefined ? '' : props.parentObj, vItem.ControlType, 'Controls')
}

function ClearClicked() {
  // alert(props.parentObj)
  screenDesignStore.deleteControl(props.parentObj, '', props.AdditionalPropertiesForControl)
};
</script>

<template>
  <!-- ID : {{ props.parentObj }} -->
  <VMenu>
    <template #activator="{ props }">
      <VBtn
        icon
        style="background-color: transparent;"
        color="white"
        elevation="0"
        size="28"
        v-bind="props"
      >
        <VIcon icon="emcAdd"></VIcon>
      </VBtn>
    </template>
    <VList>
      <VListItem
        v-for="(item, index) in items.filter(e => e.controlfor === props.menuforcontrol)"
        :key="index"
        :value="index"
      >
        <VListItemTitle @click="PerformAction(item)">
          {{ item.title }}
        </VListItemTitle>
      </vlistitem>
    </VList>
  </VMenu>
  <VBtn
    icon
    size="28"
    color="white"
    style="background-color: transparent;"
    elevation="0"
    @click="ClearClicked"
  >
    <VIcon icon="emcDelete"></VIcon>
  </VBtn>
</template>
