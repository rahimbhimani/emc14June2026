<script setup lang="ts">
import type { NotificationView } from '../../types/notification'
import { CHANNEL_META, DIRECTION_META } from '../../types/notification'

const props = defineProps<{ notification: NotificationView }>()
const emit = defineEmits<{ read: [] }>()

const primaryChannel = computed(() => props.notification.channels?.[0] ?? 'in_app')
const channelMeta = computed(() => CHANNEL_META[primaryChannel.value])
const directionLabel = computed(() => DIRECTION_META[props.notification.direction]?.label ?? '')

const formattedDate = computed(() => {
  const d = props.notification.createdAt
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  return date.toLocaleDateString()
})
</script>

<template>
  <VListItem
    :class="notification.isRead ? '' : 'bg-primary-lighten-5'"
    class="py-3 px-4"
    style="cursor: pointer"
    @click="!notification.isRead && emit('read')"
  >
    <template #prepend>
      <VAvatar :color="channelMeta.color" variant="tonal" class="me-3">
        <VIcon :icon="channelMeta.icon" />
      </VAvatar>
    </template>

    <VListItemTitle class="d-flex align-center gap-2 mb-1">
      <span
        class="text-body-2 text-truncate"
        :class="notification.isRead ? '' : 'font-weight-semibold'"
      >
        {{ notification.title }}
      </span>
      <VChip size="x-small" variant="outlined" class="ms-auto flex-shrink-0">
        {{ directionLabel }}
      </VChip>
    </VListItemTitle>

    <VListItemSubtitle class="text-caption text-truncate">
      {{ notification.body }}
    </VListItemSubtitle>

    <template #append>
      <div class="d-flex flex-column align-end gap-1 ms-2">
        <span class="text-caption text-medium-emphasis text-no-wrap">{{ formattedDate }}</span>
        <VBadge v-if="!notification.isRead" dot color="primary" inline />
      </div>
    </template>
  </VListItem>
  <VDivider />
</template>
