import mongoose from 'mongoose'

const { Schema, model, models } = mongoose

export interface IEmcInvItem {
  _id?: string
  organizationId: number
  sku: string
  name: string
  lifecycle: 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED'
  createdAt?: Date
  updatedAt?: Date
}

const EmcInvItemSchema = new Schema<IEmcInvItem>({
  organizationId: {
    type: Number,
    required: true,
    index: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  lifecycle: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED'],
    default: 'DRAFT',
    index: true
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
    index: true
  },
  updatedAt: {
    type: Date,
    default: () => new Date()
  }
}, { collection: 'emcInvItem' })

export const emcInvItem =
  models.emcInvItem ||
  model<IEmcInvItem>('emcInvItem', EmcInvItemSchema)
