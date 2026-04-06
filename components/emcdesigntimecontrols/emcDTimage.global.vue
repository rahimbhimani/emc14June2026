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

// local binding for v-file-input
const fileInputValue = ref<File | null>(null)

// preview url
const previewUrl = ref<String | null>(null)

const clearPreview = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = null
  fileInputValue.value = null
  emit('update:modelValue', null)
}




</script>

<template>
<client-only>
    <div class="emc-image-control">
      <v-file-input
        label="Capture / Upload Image"
        accept="image/*"
        capture="environment"
        clearable
        prepend-icon="mdi:camera"
        @update:modelValue="onFileChange"
      />

      <!-- PLAIN IMG (no Vuetify magic) -->
      <img
        v-if="previewUrl"
        :src="previewUrl"
        class="preview-image"
        alt="Image preview"
      />
    </div>
  </client-only>
</template>

<style scoped>
.emc-image-control {
  max-inline-size: 300px;
}

.preview-image {
  display: block;
  border: 2px solid #4caf50;
  border-radius: 8px;
  block-size: 240px;
  inline-size: 240px;
  margin-block-start: 12px;
  object-fit: cover;
}
</style>


