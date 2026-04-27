import mongoose from 'mongoose'

const { Schema, model, models } = mongoose

export interface IemcOrganization {
    _id?: string
    organizationId: number
    name: string
    code?: string
    icon?: string
    logo?: string
    description?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    country?: string
    isActive?: boolean
    createdAt?: Date
    updatedAt?: Date
}

const emcOrganizationSchema = new Schema<IemcOrganization>(
    {
        organizationId: {
            type: Number,
            required: true,
            unique: true,
            index: true
        },
        name: {
            type: String,
            required: true
        },
        code: {
            type: String,
            index: true
        },
        icon: String,
        logo: String,
        description: String,
        email: String,
        phone: String,
        address: String,
        city: String,
        country: String,
        isActive: {
            type: Boolean,
            default: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    { collection: 'emcOrganization' }
)

export const emcOrganization =
    models.emcOrganization ||
    model<IemcOrganization>(
        'emcOrganization',
        emcOrganizationSchema
    )
