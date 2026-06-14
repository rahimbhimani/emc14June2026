<script setup lang="ts">
const { unreadCount, fetchNotifications } = useNotification()
const drawerOpen = ref(false)

// Hydrate on mount so the badge count is accurate on first render.
onMounted(() => fetchNotifications())
</script>

<template>
  <VBtn icon variant="text" @click="drawerOpen = true">
    <VBadge
      :content="unreadCount > 99 ? '99+' : String(unreadCount)"
      :model-value="unreadCount > 0"
      color="error"
      overlap
    >
      <VIcon :icon="unreadCount > 0 ? 'mdi-bell-badge' : 'mdi-bell-outline'" />
    </VBadge>
  </VBtn>

  <NotificationDrawer v-model="drawerOpen" />
</template>
