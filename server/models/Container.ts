import mongoose from 'mongoose'

const { Schema, model, models } = mongoose

export interface IContainer {
    _id?: string
    name: string
    typeKey: 'warehouse' | 'uld' | 'pallet' | 'shipment'
    parentContainerId?: string | null
    fixed: boolean
    status: 'ACTIVE' | 'INACTIVE' | 'DISPATCHED'
    attributes: Record<string, any>
    createdAt: Date
    createdBy: string
    updatedAt: Date
    organizationId: string
}

const ContainerSchema = new Schema<IContainer>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    typeKey: {
        type: String,
        required: true,
        enum: ['warehouse', 'uld', 'pallet', 'shipment'],
        index: true,
    },
    parentContainerId: {
        type: String,
        default: null,
        index: true,
    },
    fixed: {
        type: Boolean,
        required: true,
        default: false,
    },
    status: {
        type: String,
        required: true,
        enum: ['ACTIVE', 'INACTIVE', 'DISPATCHED'],
        default: 'ACTIVE',
        index: true,
    },
    attributes: {
        type: Schema.Types.Mixed,
        required: true,
        default: {},
    },
    organizationId: {
        type: String,
        required: true,
        index: true,
    },
    createdBy: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
    collection: 'containers',
})

// Indexes for performance
ContainerSchema.index({ organizationId: 1, typeKey: 1 })
ContainerSchema.index({ organizationId: 1, parentContainerId: 1 })
ContainerSchema.index({ organizationId: 1, status: 1 })

// Prevent model recompilation in development
export const Container = models.Container || model<IContainer>('Container', ContainerSchema)
