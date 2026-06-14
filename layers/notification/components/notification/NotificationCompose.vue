<script setup lang="ts">
import type {
  CreateNotificationDto,
  NotificationChannel,
  NotificationDirection,
  NotificationTargetType,
} from '../../types/notification'
import { CHANNEL_META, DIRECTION_META } from '../../types/notification'

const emit = defineEmits<{ sent: []; cancel: [] }>()
const { sendNotification, broadcast } = useNotification()

// ── Static option lists ──────────────────────────────────────────────────────

const CHANNELS = Object.entries(CHANNEL_META).map(([value, meta]) => ({
  value: value as NotificationChannel,
  ...meta,
}))

const DIRECTIONS = Object.entries(DIRECTION_META).map(([value, meta]) => ({
  value: value as NotificationDirection,
  ...meta,
}))

const TARGET_TYPE_ITEMS: { value: NotificationTargetType; label: string; hint: string }[] = [
  { value: 'all',                label: 'Everyone',      hint: 'All users in scope' },
  { value: 'role',               label: 'By Role',       hint: 'e.g. admin, viewer' },
  { value: 'user',               label: 'Specific User', hint: 'User ID' },
  { value: 'organization_users', label: 'Organization',  hint: 'Org ID (platform admins only)' },
  { value: 'status',             label: 'By Status',     hint: 'active or inactive' },
]

// ── Form state ───────────────────────────────────────────────────────────────

const form = ref<CreateNotificationDto>({
  title: '',
  body: '',
  channels: ['in_app'],
  direction: 'organization_to_users',
  targets: [{ type: 'all' }],
})

const targetType = ref<NotificationTargetType>('all')
const targetValue = ref<string>('')
const scheduledAt = ref<string>('')
const sending = ref(false)
const error = ref('')
const success = ref(false)

// Keep form.targets in sync with the target picker
function syncTarget() {
  form.value.targets = [{
    type: targetType.value,
    value: targetType.value !== 'all' && targetValue.value ? targetValue.value : undefined,
  }]
}

watch([targetType, targetValue], syncTarget)

function toggleChannel(ch: NotificationChannel) {
  const idx = form.value.channels.indexOf(ch)
  if (idx >= 0) form.value.channels.splice(idx, 1)
  else form.value.channels.push(ch)
}

const canSubmit = computed(
  () => form.value.title.trim() && form.value.body.trim() && form.value.channels.length > 0,
)

// ── Submit ───────────────────────────────────────────────────────────────────

async function submit() {
  sending.value = true
  error.value = ''
  try {
    const dto: CreateNotificationDto = {
      ...form.value,
      scheduledAt: scheduledAt.value || undefined,
    }

    if (dto.direction === 'platform_to_community') {
      await broadcast({ title: dto.title, body: dto.body, channels: dto.channels, metadata: dto.metadata })
    }
    else {
      await sendNotification(dto)
    }

    success.value = true
    setTimeout(() => emit('sent'), 800)
  }
  catch (e: any) {
    error.value = e?.data?.statusMessage ?? e?.message ?? 'Failed to send notification'
  }
  finally {
    sending.value = false
  }
}

function reset() {
  form.value = { title: '', body: '', channels: ['in_app'], direction: 'organization_to_users', targets: [{ type: 'all' }] }
  targetType.value = 'all'
  targetValue.value = ''
  scheduledAt.value = ''
  error.value = ''
  success.value = false
}
</script>

<template>
  <VCard elevation="0" border>
    <VCardTitle class="d-flex align-center gap-2 pa-5 pb-3">
      <VIcon icon="mdi-send-outline" color="primary" />
      <span>Compose Notification</span>
    </VCardTitle>

    <VDivider />

    <VCardText class="pa-5">
      <VAlert v-if="error" type="error" variant="tonal" class="mb-4" closable @click:close="error = ''">
        {{ error }}
      </VAlert>
      <VAlert v-if="success" type="success" variant="tonal" class="mb-4">
        Notification sent successfully!
      </VAlert>

      <VRow>
        <!-- Direction -->
        <VCol cols="12">
          <div class="text-subtitle-2 mb-2">Direction</div>
          <div class="d-flex flex-wrap gap-2">
            <VChip
              v-for="d in DIRECTIONS"
              :key="d.value"
              :color="form.direction === d.value ? 'primary' : 'default'"
              :variant="form.direction === d.value ? 'elevated' : 'outlined'"
              :title="d.desc"
              @click="form.direction = d.value"
            >
              {{ d.label }}
            </VChip>
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ DIRECTION_META[form.direction]?.desc }}
          </div>
        </VCol>

        <!-- Channels -->
        <VCol cols="12">
          <div class="text-subtitle-2 mb-2">Channels</div>
          <div class="d-flex flex-wrap gap-2">
            <VChip
              v-for="c in CHANNELS"
              :key="c.value"
              :color="form.channels.includes(c.value) ? c.color : 'default'"
              :variant="form.channels.includes(c.value) ? 'elevated' : 'outlined'"
              :prepend-icon="c.icon"
              @click="toggleChannel(c.value)"
            >
              {{ c.label }}
            </VChip>
          </div>
        </VCol>

        <!-- Target (hidden for platform_to_community — implicit: everyone) -->
        <VCol v-if="form.direction !== 'platform_to_community' && form.direction !== 'organization_to_users'" cols="12">
          <div class="text-subtitle-2 mb-2">Target</div>
          <div class="d-flex gap-3 align-start flex-wrap">
            <VSelect
              v-model="targetType"
              :items="TARGET_TYPE_ITEMS"
              item-title="label"
              item-value="value"
              label="Target type"
              density="compact"
              style="min-width: 180px; max-width: 220px"
            />
            <VTextField
              v-if="targetType !== 'all'"
              v-model="targetValue"
              :label="TARGET_TYPE_ITEMS.find(i => i.value === targetType)?.hint ?? 'Value'"
              density="compact"
              style="min-width: 200px"
            />
          </div>
        </VCol>

        <!-- Content -->
        <VCol cols="12">
          <VTextField
            v-model="form.title"
            label="Title"
            density="compact"
            :counter="120"
            maxlength="120"
          />
        </VCol>
        <VCol cols="12">
          <VTextarea
            v-model="form.body"
            label="Message"
            rows="5"
            density="compact"
            no-resize
          />
        </VCol>

        <!-- Schedule (optional) -->
        <VCol cols="12" sm="6">
          <VTextField
            v-model="scheduledAt"
            label="Schedule for (optional)"
            type="datetime-local"
            density="compact"
            clearable
            :hint="scheduledAt ? 'Will be sent at the specified time' : 'Leave empty to send immediately'"
            persistent-hint
          />
        </VCol>
      </VRow>
    </VCardText>

    <VDivider />

    <VCardActions class="pa-4 gap-2">
      <VBtn variant="text" @click="() => { reset(); emit('cancel') }">Cancel</VBtn>
      <VSpacer />
      <VBtn variant="tonal" :disabled="!canSubmit" @click="reset">Reset</VBtn>
      <VBtn
        color="primary"
        variant="elevated"
        :loading="sending"
        :disabled="!canSubmit || success"
        :prepend-icon="scheduledAt ? 'mdi-clock-outline' : 'mdi-send'"
        @click="submit"
      >
        {{ scheduledAt ? 'Schedule' : 'Send' }}
      </VBtn>
    </VCardActions>
  </VCard>
</template>
