import EmcUser from '~~/server/models/emcUser'
import { EmcNotification, NotificationReceipt } from '../../models/emcNotification'
import { NotificationJob } from '../../models/emcNotificationJob'
import { getChannelConfig } from '../../utils/notificationConfig'
import type { NotificationChannel, ContactAddress } from '../../../types/notification'

interface BroadcastDto {
  title: string
  body: string
  channels: NotificationChannel[]
  organizationId?: number
  metadata?: Record<string, unknown>
}

// POST /api/notifications/broadcast
// Platform-admin-only. Enqueues a notification for every user (or every user in one org).
export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)

  if (user.role !== 'platform_admin')
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: platform admin role required' })

  const body = await readBody<BroadcastDto>(event)

  const direction = body.organizationId ? 'platform_to_organization' : 'platform_to_community'
  const targets   = body.organizationId
    ? [{ type: 'organization_users' as const, value: body.organizationId }]
    : [{ type: 'all' as const }]

  const notification = await EmcNotification.create({
    title:      body.title,
    body:       body.body,
    channels:   body.channels,
    direction,
    targets,
    metadata:   body.metadata,
    senderType: 'platform',
    senderId:   user.id,
    senderName: user.fullName ?? 'Platform',
    status:     'queued',
  })

  const { systemSender } = getChannelConfig()

  const from: ContactAddress = {
    name:   user.fullName ?? systemSender.name,
    email:  systemSender.email,
    userId: user.id,
  }

  const userFilter = body.organizationId ? { organizationId: body.organizationId } : {}
  const recipients = await EmcUser.find(userFilter).lean()

  const receiptDocs: Record<string, unknown>[] = []

  for (const recipient of recipients) {
    for (const channel of body.channels) {
      const hasAddress =
        channel === 'email'    ? !!recipient.email :
        channel === 'sms'      ? !!(recipient as any).phone :
        channel === 'whatsapp' ? !!(recipient as any).phone :
        channel === 'phone'    ? !!(recipient as any).phone :
        true

      if (!hasAddress) continue

      receiptDocs.push({
        notificationId: String(notification._id),
        userId:         String(recipient._id),
        userEmail:      recipient.email,
        userPhone:      (recipient as any).phone,
        organizationId: recipient.organizationId,
        channel,
        address: recipient.email ?? (recipient as any).phone ?? String(recipient._id),
        status:  'pending',
      })
    }
  }

  const receipts = receiptDocs.length
    ? await NotificationReceipt.insertMany(receiptDocs)
    : []

  const jobDocs: Record<string, unknown>[] = receipts.map((receipt, i) => {
    const rd = receiptDocs[i] as any
    return {
      notificationId: String(notification._id),
      receiptId:      String(receipt._id),
      channel:        rd.channel,
      from,
      to: {
        name:   recipients.find(r => String(r._id) === rd.userId)?.fullName,
        email:  rd.userEmail,
        phone:  rd.userPhone,
        userId: rd.userId,
      },
      subject:       body.title,
      body:          body.body,
      metadata:      body.metadata,
      status:        'pending',
      attempts:      0,
      maxAttempts:   3,
      nextAttemptAt: new Date(),
    }
  })

  if (jobDocs.length) await NotificationJob.insertMany(jobDocs)

  return {
    ok: true,
    notificationId: String(notification._id),
    direction,
    status: 'queued',
    recipients: recipients.length,
    jobs: jobDocs.length,
  }
})
