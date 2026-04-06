export type WarehouseStatus = 'Active' | 'Inactive' | 'Under Maintenance'

export type ContainerCategory = 'Fixed' | 'Variable'

export interface WarehouseContact {
    name: string
    phone?: string
    email?: string
}

export interface WarehouseCapacity {
    totalCapacity: number
    totalVolume: number
    capacityUnit: string
    volumeUnit: string
}

export interface Warehouse {
    _id?: string
    name: string
    identifier: string
    address: string
    primaryContact: WarehouseContact
    operatingHours?: string
    status: WarehouseStatus
    capacity?: WarehouseCapacity
    specialHandlingNotes?: string
    equipmentSummary?: string
    category: ContainerCategory
    organizationId?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string
}

export interface ContainerType {
    key: string
    label: string
    icon: string
    color: string
    description: string
    category: ContainerCategory
    enabled: boolean
}
