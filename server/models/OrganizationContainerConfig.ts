import mongoose from 'mongoose'

const { Schema, model, models } = mongoose

export interface IContainerAction {
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
    attachableContainers?: Array<{
        type: string
        lifecycle: string[]
    }>
}

export interface IMasterActions {
    [key: string]: IContainerAction
}

export interface IContainerConfig {
    id: string
    label: string
    organizationId: number
    category: string
    type: string
    description: string
    icon?: string
    imageUrl?: string
    canContain: string[]
    masterActions: IMasterActions
    actions: IContainerAction[]
}

export interface IOrganizationContainerConfigs {
    _id?: string
    organizationId: number
    configs: IContainerConfig[]
    createdAt?: Date
    updatedAt?: Date
}

const ContainerActionSchema = new Schema<IContainerAction>({
    id: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    icon: String,
    precondition: {
        lifecycle: [String]
    },
    roles: [{
        id: Number,
        name: String
    }],
    attachableContainers: [{
        type: String,
        lifecycle: [String]
    }]
}, { _id: false })

const ContainerConfigSchema = new Schema<IContainerConfig>({
    id: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    organizationId: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    icon: String,
    imageUrl: String,
    canContain: [String],
    masterActions: Schema.Types.Mixed,
    actions: [ContainerActionSchema]
}, { _id: false })

const OrganizationContainerConfigSchema = new Schema<IOrganizationContainerConfigs>({
    organizationId: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    configs: [ContainerConfigSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
})

export const OrganizationContainerConfig = models.OrganizationContainerConfig || model<IOrganizationContainerConfigs>('OrganizationContainerConfig', OrganizationContainerConfigSchema)
