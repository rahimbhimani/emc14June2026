<script setup lang="ts">
definePageMeta({ title: 'Compose Notification' })

const router = useRouter()
</script>

<template>
  <VRow>
    <VCol cols="12" md="8" lg="6" offset-md="2" offset-lg="3">
      <div class="d-flex align-center gap-2 mb-4">
        <VBtn icon variant="text" :to="{ path: '/emc/notifications' }">
          <VIcon icon="mdi-arrow-left" />
        </VBtn>
        <span class="text-h6">New Notification</span>
      </div>

      <NotificationCompose
        @sent="router.push('/emc/notifications')"
        @cancel="router.push('/emc/notifications')"
      />
    </VCol>
  </VRow>
</template>
