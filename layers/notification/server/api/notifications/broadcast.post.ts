import EmcUser from '~~/server/models/emcUser'
import { EmcNotification, NotificationReceipt } from '../../models/emcNotification'
import { sendViaChannel } from '../../utils/notificationSender'
import type { NotificationChannel } from '../../../types/notification'

interface BroadcastDto {
  title: string
  body: string
  channels: NotificationChannel[]
  // Optional: restrict broadcast to a single org (platform_to_organization)
  organizationId?: number
  metadata?: Record<string, unknown>
}

// POST /api/notifications/broadcast
// Platform-admin-only: sends a notification to all users (or all users of one org).
export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)

  if (user.role !== 'platform_admin')
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: platform admin role required' })

  const body = await readBody<BroadcastDto>(event)

  const direction = body.organizationId ? 'platform_to_organization' : 'platform_to_community'
  const targets = body.organizationId
    ? [{ type: 'organization_users' as const, value: body.organizationId }]
    : [{ type: 'all' as const }]

  const notification = await EmcNotification.create({
    title: body.title,
    body: body.body,
    channels: body.channels,
    direction,
    targets,
    metadata: body.metadata,
    senderType: 'platform',
    senderId: user.id,
    senderName: user.fullName ?? 'Platform',
    status: 'sending',
  })

  const userFilter = body.organizationId ? { organizationId: body.organizationId } : {}
  const recipients = await EmcUser.find(userFilter).lean()

  const receiptDocs: Record<string, unknown>[] = []

  for (const recipient of recipients) {
    for (const channel of body.channels) {
      const address =
        channel === 'email'    ? recipient.email :
        channel === 'sms'      ? (recipient as any).phone :
        channel === 'whatsapp' ? (recipient as any).phone :
        channel === 'phone'    ? (recipient as any).phone :
        String(recipient._id)  // in_app

      if (!address) continue

      const result = await sendViaChannel({ channel, address, title: body.title, body: body.body })

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
    status: 'sent',
    sentAt: new Date(),
  })

  return {
    ok: true,
    notificationId: String(notification._id),
    direction,
    recipients: recipients.length,
    receipts: receiptDocs.length,
  }
})
