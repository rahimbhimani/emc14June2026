export interface ActionRoleRequirement {
    id: number
    name: string
}

export interface AttachableContainer {
    type: string
    lifecycle: string[]
}

export interface ConfigAction {
    id: string
    label: string
    icon?: string
    precondition?: {
        lifecycle?: string[]
    }
    roles?: ActionRoleRequirement[]
    attachableContainers?: AttachableContainer[]
}

export interface ContainerConfigActions {
    [key: string]: ConfigAction
}

export interface ContainerConfig {
    id: string
    label: string
    organizationId: number
    category: string
    type: string
    description: string
    icon?: string  // MDI icon
    imageUrl?: string
    actions?: ConfigAction[]
    canContain?: string[]  // Types of containers that can be contained in this container
    masterActions?: ContainerConfigActions  // Actions available for this config type
}

export interface ContainerConfigResponse {
    success: boolean
    data: ContainerConfig[]
    error?: string
}
