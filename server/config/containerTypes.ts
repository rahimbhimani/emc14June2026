export interface AttributeSchema {
    key: string
    label: string
    control: 'text' | 'number' | 'select' | 'radio' | 'textarea' | 'checkbox' | 'date'
    required?: boolean
    options?: string[]
    section: 'primary' | 'optional'
    placeholder?: string
    helpText?: string
    min?: number
    max?: number
}

export interface ContainerType {
    typeKey: string
    label: string
    icon: string
    color: string
    fixedDefault: boolean
    allowedChildTypes: string[]
    attributesSchema: AttributeSchema[]
    description?: string
}

export const CONTAINER_TYPES: ContainerType[] = [
    {
        typeKey: 'warehouse',
        label: 'Warehouse',
        icon: 'mdi-warehouse',
        color: 'primary',
        fixedDefault: true,
        allowedChildTypes: ['uld', 'pallet', 'shipment'],
        description: 'Fixed facility for storing and managing cargo',
        attributesSchema: [
            {
                key: 'warehouseCode',
                label: 'Warehouse Code',
                control: 'text',
                required: true,
                section: 'primary',
                placeholder: 'e.g., WH-BOM-001',
            },
            {
                key: 'facilityName',
                label: 'Facility Name',
                control: 'text',
                required: true,
                section: 'primary',
                placeholder: 'e.g., Mumbai Cargo Warehouse',
            },
            {
                key: 'location',
                label: 'Location',
                control: 'text',
                required: true,
                section: 'primary',
                placeholder: 'City, Country',
            },
            {
                key: 'warehouseType',
                label: 'Warehouse Type',
                control: 'select',
                required: true,
                section: 'primary',
                options: ['Cargo Terminal', 'Distribution Center', 'Cold Storage', 'Bonded Warehouse'],
            },
            {
                key: 'address',
                label: 'Full Address',
                control: 'textarea',
                required: false,
                section: 'optional',
            },
            {
                key: 'totalAreaSqm',
                label: 'Total Area (sq m)',
                control: 'number',
                required: false,
                section: 'optional',
                min: 0,
            },
            {
                key: 'maxCapacityKg',
                label: 'Max Capacity (kg)',
                control: 'number',
                required: false,
                section: 'optional',
                min: 0,
            },
            {
                key: 'securityLevel',
                label: 'Security Level',
                control: 'select',
                required: false,
                section: 'optional',
                options: ['Standard', 'High', 'Maximum'],
            },
            {
                key: 'operatingHours',
                label: 'Operating Hours',
                control: 'text',
                required: false,
                section: 'optional',
                placeholder: 'e.g., 24/7 or 06:00-22:00',
            },
        ],
    },
    {
        typeKey: 'uld',
        label: 'ULD',
        icon: 'mdi-package-variant',
        color: 'info',
        fixedDefault: false,
        allowedChildTypes: ['shipment'],
        description: 'Unit Load Device for air cargo transport',
        attributesSchema: [
            {
                key: 'uldNumber',
                label: 'ULD Number',
                control: 'text',
                required: true,
                section: 'primary',
                placeholder: 'e.g., AKE12345AI',
                helpText: 'Unique identifier for this ULD',
            },
            {
                key: 'uldType',
                label: 'ULD Type',
                control: 'select',
                required: true,
                section: 'primary',
                options: ['AKE', 'AKN', 'AKH', 'LD3', 'LD7', 'LD9', 'PMC', 'PAG', 'PAJ'],
            },
            {
                key: 'airline',
                label: 'Airline',
                control: 'select',
                required: true,
                section: 'primary',
                options: ['AI', 'EK', 'BA', 'LH', 'SQ', 'QR', 'AA', 'UA', 'DL', 'Other'],
            },
            {
                key: 'initialStatus',
                label: 'Initial Status',
                control: 'radio',
                required: true,
                section: 'primary',
                options: ['Empty', 'Loaded'],
            },
            {
                key: 'maxWeightKg',
                label: 'Max Weight (kg)',
                control: 'number',
                required: false,
                section: 'optional',
                min: 0,
                helpText: 'Maximum weight capacity',
            },
            {
                key: 'tareWeightKg',
                label: 'Tare Weight (kg)',
                control: 'number',
                required: false,
                section: 'optional',
                min: 0,
                helpText: 'Empty weight of the ULD',
            },
            {
                key: 'contour',
                label: 'Contour',
                control: 'select',
                required: false,
                section: 'optional',
                options: ['LD3', 'LD7', 'LD9', 'M1', 'M2', 'M6'],
            },
            {
                key: 'serialNumber',
                label: 'Serial Number',
                control: 'text',
                required: false,
                section: 'optional',
            },
            {
                key: 'ownerCode',
                label: 'Owner Code',
                control: 'text',
                required: false,
                section: 'optional',
                placeholder: 'e.g., AI, EK',
            },
            {
                key: 'condition',
                label: 'Physical Condition',
                control: 'select',
                required: false,
                section: 'optional',
                options: ['Excellent', 'Good', 'Fair', 'Needs Repair'],
            },
        ],
    },
    {
        typeKey: 'pallet',
        label: 'Pallet',
        icon: 'mdi-pallet',
        color: 'success',
        fixedDefault: false,
        allowedChildTypes: ['shipment'],
        description: 'Pallet for organizing and transporting cargo',
        attributesSchema: [
            {
                key: 'palletId',
                label: 'Pallet ID',
                control: 'text',
                required: true,
                section: 'primary',
                placeholder: 'e.g., PLT-001234',
            },
            {
                key: 'palletType',
                label: 'Pallet Type',
                control: 'select',
                required: true,
                section: 'primary',
                options: ['Standard', 'Euro', 'Block', 'Custom'],
            },
            {
                key: 'material',
                label: 'Material',
                control: 'select',
                required: true,
                section: 'primary',
                options: ['Wood', 'Plastic', 'Metal', 'Composite'],
            },
            {
                key: 'currentLoad',
                label: 'Current Load',
                control: 'radio',
                required: true,
                section: 'primary',
                options: ['Empty', 'Partial', 'Full'],
            },
            {
                key: 'dimensionsCm',
                label: 'Dimensions (L×W×H cm)',
                control: 'text',
                required: false,
                section: 'optional',
                placeholder: 'e.g., 120×80×15',
            },
            {
                key: 'maxWeightKg',
                label: 'Max Weight (kg)',
                control: 'number',
                required: false,
                section: 'optional',
                min: 0,
            },
            {
                key: 'stackable',
                label: 'Stackable',
                control: 'checkbox',
                required: false,
                section: 'optional',
            },
            {
                key: 'condition',
                label: 'Condition',
                control: 'select',
                required: false,
                section: 'optional',
                options: ['New', 'Good', 'Fair', 'Damaged'],
            },
        ],
    },
    {
        typeKey: 'shipment',
        label: 'Shipment Box',
        icon: 'mdi-package',
        color: 'warning',
        fixedDefault: false,
        allowedChildTypes: [],
        description: 'Individual shipment package or box',
        attributesSchema: [
            {
                key: 'trackingNumber',
                label: 'Tracking Number',
                control: 'text',
                required: true,
                section: 'primary',
                placeholder: 'e.g., TRK123456789',
            },
            {
                key: 'awbNumber',
                label: 'AWB Number',
                control: 'text',
                required: true,
                section: 'primary',
                placeholder: 'Air Waybill Number',
            },
            {
                key: 'shipmentType',
                label: 'Shipment Type',
                control: 'select',
                required: true,
                section: 'primary',
                options: ['General Cargo', 'Perishable', 'Hazardous', 'High Value', 'Live Animals'],
            },
            {
                key: 'priority',
                label: 'Priority',
                control: 'radio',
                required: true,
                section: 'primary',
                options: ['Standard', 'Express', 'Critical'],
            },
            {
                key: 'weightKg',
                label: 'Weight (kg)',
                control: 'number',
                required: false,
                section: 'optional',
                min: 0,
            },
            {
                key: 'dimensionsCm',
                label: 'Dimensions (L×W×H cm)',
                control: 'text',
                required: false,
                section: 'optional',
                placeholder: 'e.g., 50×40×30',
            },
            {
                key: 'volumeM3',
                label: 'Volume (m³)',
                control: 'number',
                required: false,
                section: 'optional',
                min: 0,
            },
            {
                key: 'origin',
                label: 'Origin',
                control: 'text',
                required: false,
                section: 'optional',
            },
            {
                key: 'destination',
                label: 'Destination',
                control: 'text',
                required: false,
                section: 'optional',
            },
            {
                key: 'customerName',
                label: 'Customer Name',
                control: 'text',
                required: false,
                section: 'optional',
            },
            {
                key: 'specialInstructions',
                label: 'Special Instructions',
                control: 'textarea',
                required: false,
                section: 'optional',
            },
            {
                key: 'temperatureControlled',
                label: 'Temperature Controlled',
                control: 'checkbox',
                required: false,
                section: 'optional',
            },
        ],
    },
]

export function getContainerTypeByKey(typeKey: string): ContainerType | undefined {
    return CONTAINER_TYPES.find(t => t.typeKey === typeKey)
}

export function getContainerTypeLabel(typeKey: string): string {
    return getContainerTypeByKey(typeKey)?.label || typeKey
}
