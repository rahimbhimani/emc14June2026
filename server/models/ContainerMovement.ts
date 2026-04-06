import mongoose from 'mongoose'

const { Schema, model, models } = mongoose

export interface IContainerMovement {
    _id?: string
    organizationId: number
    actionId?: string
    actionLabel?: string
    movementType: 'Activate' | 'Attach' | 'Detach' | 'Close' | 'Reopen' | 'Archive'
    parentContainerId: string
    parentContainerType: string
    childContainerId?: string
    childContainerType?: string
    fromStatus?: string
    toStatus: string
    parentStatusBefore?: string
    parentStatusAfter?: string
    movedBy?: string
    movedByName?: string
    movedByCode?: string
    movedAt?: Date
    createdAt?: Date
    updatedAt?: Date
}

const ContainerMovementSchema = new Schema<IContainerMovement>({
    organizationId: {
        type: Number,
        required: true,
        index: true,
    },
    actionId: String,
    actionLabel: String,
    movementType: {
        type: String,
        enum: ['Activate', 'Attach', 'Detach', 'Close', 'Reopen', 'Archive'],
        required: true,
        default: 'Attach',
        index: true,
    },
    parentContainerId: {
        type: String,
        required: true,
        index: true,
    },
    parentContainerType: {
        type: String,
        required: true,
        index: true,
    },
    childContainerId: {
        type: String,
        index: true,
    },
    childContainerType: String,
    fromStatus: String,
    toStatus: {
        type: String,
        required: true,
    },
    parentStatusBefore: String,
    parentStatusAfter: String,
    movedBy: String,
    movedByName: String,
    movedByCode: String,
    movedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    collection: 'ContainerMovement',
})

export const ContainerMovement = models.ContainerMovement || model<IContainerMovement>('ContainerMovement', ContainerMovementSchema)
