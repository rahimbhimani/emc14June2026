import mongoose from 'mongoose'
import type { INotificationJob } from '../../types/notification'

const { Schema, model, models } = mongoose

const contactSchema = new Schema(
  {
    name:   String,
    email:  String,
    phone:  String,
    userId: String,
    role:   String,
  },
  { _id: false },
)

const notificationJobSchema = new Schema<INotificationJob>(
  {
    notificationId: { type: String, required: true, index: true },
    receiptId:      { type: String, index: true },

    channel: {
      type: String,
      enum: ['email', 'sms', 'whatsapp', 'phone', 'in_app'],
      required: true,
    },

    from: { type: contactSchema, required: true },
    to:   { type: contactSchema, required: true },

    subject: { type: String, required: true },
    body:    { type: String, required: true },
    html:    String,
    metadata: Schema.Types.Mixed,

    status: {
      type: String,
      enum: ['pending', 'processing', 'done', 'failed'],
      default: 'pending',
      index: true,
    },

    attempts:     { type: Number, default: 0 },
    maxAttempts:  { type: Number, default: 3 },
    nextAttemptAt: { type: Date, default: () => new Date(), index: true },

    lastError:   String,
    processedAt: Date,
  },
  { timestamps: true },
)

// Compound index for the queue poll query
notificationJobSchema.index({ status: 1, nextAttemptAt: 1 })

export const NotificationJob =
  models.NotificationJob || model<INotificationJob>('NotificationJob', notificationJobSchema)
