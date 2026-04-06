export interface ContainerAction {
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
}

export interface ContainerTypeData {
    [key: string]: any
}

export interface Container {
    id: string
    organizationId: number
    label: string
    category: string
    type: string
    description?: string
    lifecycle: 'DRAFT' | 'READY' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
    specialHandlingNotes?: string
    imageUrl?: string
    typeData?: ContainerTypeData
    actions?: ContainerAction[]
    roles?: Array<{
        id: number
        name: string
    }>
    createdAt?: string
    createdBy?: string
    modifiedAt?: string
    modifiedBy?: string
}

export interface ContainerResponse {
    success: boolean
    data: Container[]
    error?: string
}

export interface ContainerMapping {
    id: string
    containerId: string
    mappedToContainerId: string
    mappedAt: string
    status: 'Active' | 'Archived' | 'Pending'
    changedBy?: string
    changedAt?: string
}

export interface ContainerMappingHistory {
    id: string
    containerId: string
    previousMappedTo?: string
    newMappedTo: string
    changedAt: string
    changedBy: string
    reason?: string
}

export interface UserContext {
    id: string
    organizationId: number
    roles: Array<{
        id: number
        name: string
    }>
}
