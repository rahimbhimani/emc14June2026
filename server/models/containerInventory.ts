import mongoose from 'mongoose'

const { Schema, model, models } = mongoose

export interface IContainerInventory {
    _id?: string
    organizationId: number
    containerId: string
    containerType: 'Warehouse' | 'Trolley'
    itemId: string
    quantityOnHand: number
    quantityReserved: number
    quantityAvailable: number
    createdAt?: Date
    updatedAt?: Date
}

const ContainerInventorySchema = new Schema<IContainerInventory>({
    organizationId: {
        type: Number,
        required: true,
        index: true
    },
    containerId: {
        type: String,
        required: true,
        index: true
    },
    containerType: {
        type: String,
        enum: ['Warehouse', 'Trolley'],
        required: true
    },
    itemId: {
        type: String,
        required: true,
        index: true
    },
    quantityOnHand: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    quantityReserved: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    quantityAvailable: {
        type: Number,
        required: true,
        default: 0,
        min: 0
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
})

// Unique compound index as per specification
ContainerInventorySchema.index(
    { organizationId: 1, containerId: 1, itemId: 1 },
    { unique: true }
)

export const containerInventory =
    models.containerInventory ||
    model<IContainerInventory>('containerInventory', ContainerInventorySchema)
