import mongoose from 'mongoose'

const { Schema, model, models } = mongoose

export interface IEmcInventoryMovement {
    _id?: string
    organizationId: number
    movementType: 'StockReceipt' | 'StockIssue' | 'Transfer' | 'LOAD_TO_FLIGHT'
    containerId: string
    containerType: string
    itemId?: string
    sourceContainer?: string
    sourceContainerType?: string
    destinationContainer?: string
    destinationContainerType?: string
    quantity: number
    reference?: string
    remarks?: string
    performedBy: string
    performedAt: Date
    createdAt?: Date
}

const EmcInventoryMovementSchema = new Schema<IEmcInventoryMovement>({
    organizationId: {
        type: Number,
        required: true,
        index: true
    },
    movementType: {
        type: String,
        enum: ['StockReceipt', 'StockIssue', 'Transfer', 'LOAD_TO_FLIGHT'],
        required: true
    },
    containerId: {
        type: String,
        required: true,
        index: true
    },
    containerType: {
        type: String,
        required: true
    },
    sourceContainer: {
        type: String,
        default: null
    },
    sourceContainerType: {
        type: String,
        default: null
    },
    destinationContainer: {
        type: String,
        default: null
    },
    destinationContainerType: {
        type: String,
        default: null
    },
    itemId: {
        type: String,
        index: true
    },
    quantity: {
        type: Number,
        required: true
    },
    reference: {
        type: String,
        default: null
    },
    remarks: {
        type: String,
        default: null
    },
    performedBy: {
        type: String,
        required: true
    },
    performedAt: {
        type: Date,
        required: true,
        index: true,
        default: () => new Date()
    },
    createdAt: {
        type: Date,
        default: () => new Date()
    }
})

// Index on performedAt for sorting (descending)
EmcInventoryMovementSchema.index({ performedAt: -1 })

export const emcInventoryMovements =
    models.emcInventoryMovements ||
    model<IEmcInventoryMovement>(
        'emcInventoryMovements',
        EmcInventoryMovementSchema
    )
