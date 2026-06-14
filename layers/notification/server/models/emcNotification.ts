import mongoose from 'mongoose'
import type { IEmcNotification, INotificationReceipt } from '../../types/notification'

const { Schema, model, models } = mongoose

// ── Notification ────────────────────────────────────────────────────────────
const notificationSchema = new Schema<IEmcNotification>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    channels: {
      type: [{ type: String, enum: ['email', 'sms', 'whatsapp', 'phone', 'in_app'] }],
      required: true,
    },
    direction: {
      type: String,
      enum: ['platform_to_community', 'platform_to_organization', 'organization_to_users', 'direct'],
      required: true,
    },
    senderType: {
      type: String,
      enum: ['platform', 'organization', 'user'],
      required: true,
    },
    senderId: String,
    senderName: String,
    targets: [
      {
        type: { type: String, enum: ['all', 'role', 'user', 'organization_users', 'status'], required: true },
        value: Schema.Types.Mixed,
      },
    ],
    metadata: Schema.Types.Mixed,
    scheduledAt: Date,
    sentAt: Date,
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'],
      default: 'draft',
    },
  },
  { timestamps: true },
)

notificationSchema.index({ status: 1 })
notificationSchema.index({ direction: 1 })
notificationSchema.index({ senderType: 1, senderId: 1 })

// ── Receipt (per-recipient delivery record) ─────────────────────────────────
const receiptSchema = new Schema<INotificationReceipt>(
  {
    notificationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: String,
    userPhone: String,
    organizationId: Number,
    channel: {
      type: String,
      enum: ['email', 'sms', 'whatsapp', 'phone', 'in_app'],
      required: true,
    },
    address: { type: String, required: true },
    deliveredAt: Date,
    readAt: Date,
    status: {
      type: String,
      enum: ['pending', 'delivered', 'read', 'failed'],
      default: 'pending',
    },
    errorMessage: String,
  },
  { timestamps: true },
)

receiptSchema.index({ notificationId: 1, userId: 1 })
receiptSchema.index({ userId: 1, readAt: 1 })

export const EmcNotification =
  models.EmcNotification || model<IEmcNotification>('EmcNotification', notificationSchema)

export const NotificationReceipt =
  models.NotificationReceipt || model<INotificationReceipt>('NotificationReceipt', receiptSchema)
