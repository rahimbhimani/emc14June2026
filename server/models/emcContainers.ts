import mongoose from 'mongoose'

const { Schema, model, models } = mongoose

export interface IContainer {
  _id?: string
  id: string
  organizationId: number
  label: string
  category: string
  type: string
  description?: string
  lifecycle: 'DRAFT' | 'READY' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
  imageUrl?: string
  specialHandlingNotes?: string
  typeData?: Record<string, any>
  actions?: Array<{
    id: string
    label: string
    icon?: string
    precondition?: {
      lifecycle?: string[]
    }
    roles?: Array<{
      id: number
      name: string
    }>
  }>
  createdAt?: Date
  updatedAt?: Date
}

const ContainerSchema = new Schema<IContainer>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  organizationId: {
    type: Number,
    required: true,
    index: true
  },
  label: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    index: true
  },
  description: String,
  lifecycle: {
    type: String,
    enum: ['DRAFT', 'READY', 'ACTIVE', 'CLOSED', 'ARCHIVED'],
    default: 'DRAFT',
    index: true
  },
  imageUrl: String,
  specialHandlingNotes: String,
  typeData: Schema.Types.Mixed,
  actions: [{
    id: String,
    label: String,
    icon: String,
    precondition: {
      lifecycle: [String]
    },
    roles: [{
      id: Number,
      name: String
    }]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'emcContainers' })

export const emcContainers = models.emcContainers || model<IContainer>('emcContainers', ContainerSchema)
