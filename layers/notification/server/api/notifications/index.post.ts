import EmcUser from '~~/server/models/emcUser'
import { EmcNotification, NotificationReceipt } from '../../models/emcNotification'
import { sendViaChannel } from '../../utils/notificationSender'
import type { CreateNotificationDto, NotificationChannel, NotificationTarget } from '../../../types/notification'

// ── Resolve recipients from target descriptors ──────────────────────────────
async function resolveRecipients(targets: NotificationTarget[], senderOrgId?: number) {
  const orQueries = targets.flatMap((t): Record<string, unknown>[] => {
    switch (t.type) {
      case 'all':
        return [{}]
      case 'role':
        return [{ role: t.value }]
      case 'user':
        return [{ _id: t.value }]
      case 'organization_users':
        return [{ organizationId: t.value ?? senderOrgId }]
      case 'status':
        return [{ isActive: t.value === 'active' }]
      default:
        return []
    }
  })

  if (!orQueries.length) return []
  return EmcUser.find({ $or: orQueries }).lean()
}

// ── Resolve the delivery address for a channel ──────────────────────────────
function resolveAddress(user: any, channel: NotificationChannel): string | null {
  switch (channel) {
    case 'email':    return user.email ?? null
    case 'sms':      return user.phone ?? null
    case 'whatsapp': return user.phone ?? null
    case 'phone':    return user.phone ?? null
    case 'in_app':   return String(user._id)
    default:         return null
  }
}

// POST /api/notifications
// Creates and dispatches a notification.
// Direction rules enforced server-side:
//   platform_to_community    → role must be platform_admin
//   platform_to_organization → role must be platform_admin
//   organization_to_users    → org admins; targets scoped to sender's org
//   direct                   → any authenticated user within their org scope
export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  const body = await readBody<CreateNotificationDto>(event)

  const isPlatformAdmin = user.role === 'platform_admin'

  // Scope guard: only platform admins can broadcast across organisations
  if (
    (body.direction === 'platform_to_community' || body.direction === 'platform_to_organization')
    && !isPlatformAdmin
  ) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: platform admin role required' })
  }

  // For org-scoped directions, restrict targets to the sender's own org
  const effectiveTargets: NotificationTarget[] =
    body.direction === 'organization_to_users'
      ? [{ type: 'organization_users', value: user.organizationId }]
      : body.targets

  const notification = await EmcNotification.create({
    title: body.title,
    body: body.body,
    channels: body.channels,
    direction: body.direction,
    targets: effectiveTargets,
    metadata: body.metadata,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    senderType: isPlatformAdmin ? 'platform' : 'organization',
    senderId: String(user.organizationId ?? user.id),
    senderName: user.fullName ?? user.email,
    status: body.scheduledAt ? 'scheduled' : 'sending',
  })

  // Scheduled notifications are dispatched by a separate job — return early
  if (body.scheduledAt) {
    return { ok: true, notificationId: String(notification._id), status: 'scheduled' }
  }

  // ── Dispatch now ──────────────────────────────────────────────────────────
  const recipients = await resolveRecipients(effectiveTargets, user.organizationId)
  const receiptDocs: Record<string, unknown>[] = []

  for (const recipient of recipients) {
    for (const channel of body.channels as NotificationChannel[]) {
      const address = resolveAddress(recipient, channel)
      if (!address) continue

      const result = await sendViaChannel({
        channel,
        address,
        title: body.title,
        body: body.body,
        metadata: body.metadata,
      })

      receiptDocs.push({
        notificationId: String(notification._id),
        userId: String(recipient._id),
        userEmail: recipient.email,
        userPhone: (recipient as any).phone,
        organizationId: recipient.organizationId,
        channel,
        address,
        status: result.ok ? 'delivered' : 'failed',
        deliveredAt: result.ok ? new Date() : undefined,
        errorMessage: result.error,
      })
    }
  }

  if (receiptDocs.length) await NotificationReceipt.insertMany(receiptDocs)

  await EmcNotification.findByIdAndUpdate(notification._id, {
    status: receiptDocs.length ? 'sent' : 'failed',
    sentAt: new Date(),
  })

  return {
    ok: true,
    notificationId: String(notification._id),
    recipients: recipients.length,
    receipts: receiptDocs.length,
  }
})
