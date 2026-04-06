<script setup lang="ts">
import { userDataStore } from '@/store/userDataStore'
import { onBeforeUnmount, ref, watchEffect } from 'vue'

/* ---------------- EMC bindings ---------------- */

const props = defineProps({
  vbind1: { type: Object },
  FormParameters: { type: Object },
  inputdata: { type: Object },
})

const groupObject = defineModel('groupObject')

const muserDataStore = props.vbind1?.isthisfordialog
  ? (props as any).inputdata?.value
  : userDataStore()

const RTData = useUpdateObject(
  muserDataStore.data.FormData.UserEntryObjects,
  groupObject
)

/* ---------------- State ---------------- */

const previewUrl = ref<string | null>(null)
const loading = ref(false)
const imageState = ref<'not-defined' | 'loading' | 'loaded' | 'not-found'>(
  'not-defined'
)

const showZoom = ref(false)
const zoomX = ref(0)
const zoomY = ref(0)
const ZOOM = 2

/* ---------------- Helpers ---------------- */

function revokePreviewUrl() {
  if (previewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
}

function getImageFromAnySource(): string | null {
  const v = RTData.dataValue.value

  // runtime DB image
  if (v?.imagePath?.length) {
    const raw = v.imagePath[0]
    if (raw.startsWith('/uploads/')) {
      return '/api/emcapi/emcgetImage/' + raw.replace('/uploads/', '')
    }
    return raw
  }

  // runtime File
  if (v instanceof File) {
    return URL.createObjectURL(v)
  }

  // dialog data
  const sourceData = props.vbind1?.isthisfordialog
    ? (props as any).inputdata?.value
    : props.inputdata

  const dbImage = sourceData?.gbImage?.Image
  if (dbImage?.imagePath?.length) {
    const raw = dbImage.imagePath[0]
    if (raw.startsWith('/uploads/')) {
      return '/api/emcapi/emcgetImage/' + raw.replace('/uploads/', '')
    }
    return raw
  }

  return null
}

/* ---------------- Watcher ---------------- */

watchEffect(() => {
  revokePreviewUrl()

  const src = getImageFromAnySource()

  if (!src) {
    previewUrl.value = null
    loading.value = false
    imageState.value = 'not-defined'
    return
  }

  previewUrl.value = src
  loading.value = true
  imageState.value = 'loading'
})

/* ---------------- Image events ---------------- */

const onImageLoaded = () => {
  loading.value = false
  imageState.value = 'loaded'
}

const onImageError = () => {
  loading.value = false
  imageState.value = 'not-found'
}

/* ---------------- Retry ---------------- */

const retryLoad = () => {
  if (!previewUrl.value) return
  loading.value = true
  imageState.value = 'loading'
  previewUrl.value = previewUrl.value + `?t=${Date.now()}`
}

/* ---------------- File upload ---------------- */

const onFileChange = (val: File | File[] | null) => {
  if (!val) {
    previewUrl.value = null
    imageState.value = 'not-defined'
    return
  }

  const file = Array.isArray(val) ? val[0] : val
  if (!(file instanceof File)) return

  revokePreviewUrl()

  previewUrl.value = URL.createObjectURL(file)
  loading.value = true
  imageState.value = 'loading'

  RTData.dataValue.value = file

  if (!muserDataStore.data.FormData.UserEntryObjects.BinaryData) {
    muserDataStore.data.FormData.UserEntryObjects.BinaryData = []
  }

  muserDataStore.data.FormData.UserEntryObjects.BinaryData.push({
    ControlName: groupObject.value.controlName,
    dataValue: file,
    datapath: groupObject.value.dataPath,
    Type: 'Image',
    mimeType: file.type,
  })
}

/* ---------------- Zoom ---------------- */

const onMouseMove = (e: MouseEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  zoomX.value = e.clientX - rect.left
  zoomY.value = e.clientY - rect.top
}

onBeforeUnmount(revokePreviewUrl)
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

      <!-- IMAGE (always renders if previewUrl exists) -->
      <div
        v-if="previewUrl"
        class="preview-container"
        @mouseenter="showZoom = true"
        @mouseleave="showZoom = false"
        @mousemove="onMouseMove"
      >
        <div class="preview-wrapper">
          <img
            :src="previewUrl"
            class="preview-image"
            @load="onImageLoaded"
            @error="onImageError"
          />

          <div v-if="loading" class="loading-overlay">
            <v-progress-circular indeterminate size="32" />
          </div>

          <div class="hover-overlay">Hover to zoom</div>
        </div>

        <div v-if="showZoom && imageState === 'loaded'" class="zoom-popup">
          <img
            :src="previewUrl"
            class="zoom-image"
            :style="{
              transform: `translate(${-zoomX * ZOOM + 200}px, ${-zoomY * ZOOM + 200}px)`
            }"
          />
        </div>
      </div>

      <!-- STATES -->
      <div v-else-if="imageState === 'not-found'" class="no-image error">
        Image not found
        <v-btn size="small" variant="text" @click="retryLoad">Retry</v-btn>
      </div>

      <div v-else class="no-image">
        Image is not defined
      </div>
    </div>
  </client-only>
</template>

<style scoped>
.emc-image-control {
  position: relative;
  max-inline-size: 280px;
}

.preview-container {
  position: relative;
  display: flex;
  justify-content: center;
  margin-block-start: 14px;
}

.preview-wrapper {
  position: relative;
}

.preview-image {
  border: 1px solid #ddd;
  border-radius: 10px;
  block-size: 240px;
  inline-size: 240px;
  object-fit: contain;
}

.loading-overlay {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 70%);
  inset: 0;
}

.hover-overlay {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 35%);
  color: white;
  inset: 0;
  opacity: 0;
}

.preview-wrapper:hover .hover-overlay {
  opacity: 1;
}

.zoom-popup {
  position: absolute;
  background: white;
  block-size: 420px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 25%);
  inline-size: 420px;
  inset-inline-start: 260px;
}

.zoom-image {
  block-size: 480px;
  inline-size: 480px;
  object-fit: contain;
}

.no-image {
  font-size: 13px;
  margin-block-start: 10px;
  opacity: 0.7;
}

.no-image.error {
  color: #c62828;
}
</style>
