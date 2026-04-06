import mongoose from 'mongoose'

const { Schema, model, models } = mongoose

export interface IContainerAssociation {
  _id?: string
  organizationId: number
  actionId: string
  actionLabel: string
  parentContainerId: string
  parentContainerType: string
  childContainerIds: string[]
  itemQuantities?: Map<string, number> | Record<string, number>
  status: 'active' | 'inactive' | 'archived'
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
}

const ContainerAssociationSchema = new Schema<IContainerAssociation>({
  organizationId: {
    type: Number,
    required: true,
    index: true
  },
  actionId: {
    type: String,
    required: true
  },
  actionLabel: {
    type: String,
    required: true
  },
  parentContainerId: {
    type: String,
    required: true,
    index: true
  },
  parentContainerType: {
    type: String,
    required: true,
    index: true
  },
  childContainerIds: {
    type: [String],
    required: true,
    index: true
  },
  itemQuantities: {
    type: Map,
    of: Number,
    default: new Map()
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: String
}, { collection: 'ContainerAssociation' })

export const ContainerAssociation = models.ContainerAssociation || model<IContainerAssociation>('ContainerAssociation', ContainerAssociationSchema)
