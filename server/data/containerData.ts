export const containerTypeDefinitions = [
    {
        type: "Warehouse",
        category: "Fixed",
        displayLabel: "Warehouse",
        actions: [
            {
                name: "Create",
                label: "Create Warehouse",
                roles: ["Admin"],
                allowedLifecycle: ["Available"]
            },
            {
                name: "Attach",
                label: "Add Zone / ULD",
                roles: ["Admin"],
                allowedLifecycle: ["Available"]
            }
        ]
    },
    {
        type: "ULD",
        category: "Movable",
        displayLabel: "ULD",
        actions: [
            {
                name: "Create",
                label: "Create ULD",
                roles: ["Admin"]
            },
            {
                name: "Load",
                label: "Load Cargo",
                roles: ["Admin", "Operator"],
                allowedLifecycle: ["Available"]
            }
        ]
    }
]

export const containers = [
    {
        id: "WHDEL01",
        organizationId: 12313,
        label: "Delhi Warehouse",
        type: "Warehouse",
        category: "Fixed",
        lifecycle: "Available"
    },
    {
        id: "ULD001",
        label: "AKE001",
        type: "ULD",
        category: "Movable",
        lifecycle: "Available"
    },
    {
        id: "ULD002",
        label: "AKE002",
        type: "ULD",
        category: "Movable",
        lifecycle: "Available"
    },
    {
        id: "ULD003",
        label: "AKE003",
        type: "ULD",
        category: "Movable",
        lifecycle: "Maintenance"
    },
    {
        id: "ULD004",
        label: "AKE004",
        type: "ULD",
        category: "Movable",
        lifecycle: "Available"
    }
]
