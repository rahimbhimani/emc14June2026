<script setup lang="ts">
interface Props {
  confirmationQuestion: string
  isDialogVisible: boolean
  confirmTitle: string
  confirmMsg: string
  cancelTitle: string
  cancelMsg: string
}

interface Emit {
  (e: 'update:isDialogVisible', value: boolean): void
  (e: 'confirm', value: boolean): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emit>()

const cancelled = ref(false)

const updateModelValue = (val: boolean) => {
  emit('update:isDialogVisible', val)
}

const onConfirmation = () => {
  emit('confirm', true)
  updateModelValue(false)

  // unsubscribed.value = true
}

const onCancel = () => {
  emit('confirm', false)
  emit('update:isDialogVisible', false)
  cancelled.value = true
}
</script>

<template>
  <!-- 👉 Confirm Dialog -->
  <VDialog
    max-width="500"
    :model-value="props.isDialogVisible"
  >
    <VCard>
      <VCardTitle>
        <VSystemBar style="background-color:lightskyblue!important">
          <h4 style="font-weight: normal">
            Delete confirmation
          </h4>
          <VSpacer />
          <VIcon
            color="blue"
            @click="onCancel"
          >
            {{ $vuetify.icons.aliases?.emcDelete }}
          </VIcon>
        </VSystemBar>
      </VCardTitle>

      <VCardText style="block-size: 8vh">
        <div
          class="pt-7"
          style=" display: flex; align-items: center;block-size: 8vh;float: inline-start;"
        >
          <VIcon
            style="background-color: maroon"
            color="maroon"
          >
            {{ $vuetify.icons.aliases.emcDelete }}
          </VIcon>
          <h4
            style="font-weight: normal"
            class="pl-5"
          >
            {{ confirmationQuestion }}
          </h4>
        </div>
      </VCardText>

      <VCardActions class="mt-2 mb-2">
        <VSpacer />
        <VBtn
          color="black"
          elevation="10"
          @click="onConfirmation"
        >
          Yes
        </VBtn>
        <VBtn
          color="black"
          @click="onCancel"
        >
          No
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
