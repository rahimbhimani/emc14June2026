<script setup>
import { useScreenDesignStore } from '@/store/screenDesignStore'

defineOptions({
  inheritAttrs: true,
})

const props = defineProps({

  groupObject: {
    type: Object,
  },
  ParentID: {
    type: Object,
  },
  AdditionalPropertiesForControl: '',
})

const screenDesignStore = useScreenDesignStore()

function DeleteControl() {
  // alert(props.groupObject.id)
  screenDesignStore.updateControl(props.groupObject.id, 'NoControl', 'Controls', props.AdditionalPropertiesForControl === undefined ? '' : props.AdditionalPropertiesForControl)
}
</script>

<template>
  <!-- {{groupObject}} -->
  <VAutocomplete
    :append-inner-icon="$vuetify.icons.aliases.emcDelete"
    @click:append-inner="DeleteControl"
  />

</template>

<style>
/* Custom styles for the Vuetify text field with class 'custom-border' */
.custom-border .v-input__control .v-field{
  border: 2px solid #9d735d; /* 2px width solid red border */
  border-radius: 12px; /* Optional: Add border-radius for rounded corners */
}
</style>
