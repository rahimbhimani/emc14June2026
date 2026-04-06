# Container Management System - Design Discussion

**Created:** February 1, 2026  
**Status:** Draft - Under Discussion  
**Version:** 1.0

---

## Overview

Design and implementation plan for a generic container management system supporting hierarchical containers with configurable actions and movement types.

---

## Requirements

### Container Types

1. **Warehouse** - Movement Type: `Fixed`
2. **Location** - Movement Type: `Fixed`
3. **ULD (Unit Load Device)** - Movement Type: `Variable`
4. **Aircraft** - Movement Type: `Variable`
5. **Items** - Movement Type: `Variable`

### Movement Types

- **Fixed**: Containers that don't move (Warehouse, Location)
- **Variable**: Containers that can be transported (ULD, Aircraft, Items)

### Hierarchical Rules

One container type can include other containers following these rules:

- **Warehouse** can contain: Location, ULD, Items
- **Location** can contain: ULD, Items
- **ULD** can contain: Items
- **Aircraft** can contain: ULD, Items
- **Items** cannot contain other containers (leaf node)

### Actions

The following actions can be performed on containers (all configurable):

1. **Create** - Initialize a new container
2. **Open** - Open container for loading
3. **Fill** - Add items/containers into the container
4. **Close** - Seal/close the container
5. **Transfer** - Move container from one location to another

---

## Proposed Solution Architecture

### 1. Data Model Structure

```typescript
interface Container {
  id: string;
  type: 'Warehouse' | 'Location' | 'ULD' | 'Aircraft' | 'Items';
  movementType: 'Fixed' | 'Variable';
  name: string;
  code: string;
  status: 'Created' | 'Open' | 'Filled' | 'Closed' | 'InTransit';
  
  // Hierarchy
  parentContainerId?: string;
  childContainers: string[]; // IDs of nested containers
  allowedChildTypes: ContainerType[]; // What can be nested inside
  
  // Capacity & Constraints
  capacity?: {
    maxWeight?: number;
    maxVolume?: number;
    maxItems?: number;
  };
  currentLoad?: {
    weight: number;
    volume: number;
    itemCount: number;
  };
  
  // Location tracking (for Variable types)
  currentLocation?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    timestamp?: Date;
  };
  
  // Actions configuration
  allowedActions: ContainerAction[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  attributes?: Record<string, any>; // Custom fields
}

interface ContainerAction {
  action: 'Create' | 'Open' | 'Fill' | 'Close' | 'Transfer';
  enabled: boolean;
  conditions?: string[]; // e.g., "status === 'Created'"
  requiredFields?: string[];
}

interface ContainerConfig {
  type: ContainerType;
  movementType: 'Fixed' | 'Variable';
  allowedChildTypes: ContainerType[];
  defaultCapacity?: Capacity;
  availableActions: ContainerAction[];
  stateTransitions: StateTransition[];
}
```

### 2. Hierarchical Rules Matrix

```typescript
const CONTAINER_HIERARCHY_RULES = {
  Warehouse: {
    movementType: 'Fixed',
    canContain: ['Location', 'ULD', 'Items'],
    canBeContainedIn: []
  },
  Location: {
    movementType: 'Fixed',
    canContain: ['ULD', 'Items'],
    canBeContainedIn: ['Warehouse']
  },
  ULD: {
    movementType: 'Variable',
    canContain: ['Items'],
    canBeContainedIn: ['Warehouse', 'Location', 'Aircraft']
  },
  Aircraft: {
    movementType: 'Variable',
    canContain: ['ULD', 'Items'],
    canBeContainedIn: []
  },
  Items: {
    movementType: 'Variable',
    canContain: [],
    canBeContainedIn: ['Warehouse', 'Location', 'ULD', 'Aircraft']
  }
};
```

### 3. Action State Machine

```typescript
const ACTION_STATE_MACHINE = {
  Create: {
    fromStatus: null,
    toStatus: 'Created',
    allowedFor: ['all']
  },
  Open: {
    fromStatus: ['Created', 'Closed'],
    toStatus: 'Open',
    allowedFor: ['Warehouse', 'Location', 'ULD', 'Aircraft']
  },
  Fill: {
    fromStatus: ['Open'],
    toStatus: 'Filled',
    allowedFor: ['all']
  },
  Close: {
    fromStatus: ['Filled', 'Open'],
    toStatus: 'Closed',
    allowedFor: ['all']
  },
  Transfer: {
    fromStatus: ['Closed', 'Filled'],
    toStatus: 'InTransit',
    allowedFor: ['ULD', 'Aircraft', 'Items'] // Variable types only
  }
};
```

### 4. UI Component Structure

```
pages/emc/emccontainer/
├── emcContainerManagement.vue        # Main page
├── components/
│   ├── ContainerTree.vue             # Hierarchical tree view
│   ├── ContainerCard.vue             # Individual container card
│   ├── ContainerActionPanel.vue      # Action buttons (Create/Open/Fill/Close/Transfer)
│   ├── ContainerForm.vue             # Create/Edit form
│   ├── ContainerTransferDialog.vue   # Transfer between containers
│   ├── ContainerHierarchyView.vue    # Visual hierarchy diagram
│   └── ContainerConfigPanel.vue      # Admin: Configure actions per type
```

### 5. Configuration Approach

**Option A: Database-Driven (Recommended)**
- Store configuration in database table `ContainerTypeConfig`
- Admins can enable/disable actions per container type via UI
- Runtime validation based on config

**Option B: Code + Override**
- Default rules in code (as above)
- Database overrides for specific use cases
- Best of both worlds

### 6. API Endpoints

```typescript
// Container CRUD
POST   /api/containers              // Create container
GET    /api/containers/:id          // Get container details
PUT    /api/containers/:id          // Update container
DELETE /api/containers/:id          // Delete container

// Actions
POST   /api/containers/:id/open     // Open container
POST   /api/containers/:id/fill     // Add items to container
POST   /api/containers/:id/close    // Close container
POST   /api/containers/:id/transfer // Transfer to another container

// Hierarchy
GET    /api/containers/:id/children // Get child containers
GET    /api/containers/:id/tree     // Get full hierarchy tree
POST   /api/containers/:id/nest     // Nest container inside another

// Configuration
GET    /api/container-configs       // Get all type configurations
PUT    /api/container-configs/:type // Update configuration
```

### 7. Visual UI Layout Proposal

```
┌─────────────────────────────────────────────────────────┐
│  Container Management                    [+ Create]      │
├──────────┬──────────────────────────────────────────────┤
│          │  Container: WAREHOUSE_001                     │
│  Tree    │  Type: Warehouse | Movement: Fixed           │
│  View    │  Status: Open | Load: 45% (2500kg/5500kg)   │
│          │  ──────────────────────────────────────────  │
│ ✓ WH-001 │  Actions: [Open] [Fill] [Close] [Transfer]  │
│   ├ LOC1 │  ──────────────────────────────────────────  │
│   │ └ULD │  Child Containers (3):                       │
│   └ LOC2 │  ┌──────────────────────────────────────┐   │
│ ✓ WH-002 │  │ LOC-001 | Location | 1200kg          │   │
│          │  │ ULD-045 | ULD       | 800kg           │   │
│ Filter:  │  │ ITEMS-1 | Items     | 500kg           │   │
│ [____]   │  └──────────────────────────────────────┘   │
└──────────┴──────────────────────────────────────────────┘
```

---

## Open Questions

### 1. Validation Rules
- Should there be weight/volume constraints when nesting containers?
- Example: ULD can't exceed aircraft capacity
- How to handle capacity overflow scenarios?

### 2. Transfer Logic
- When transferring a container, should child containers move automatically?
- Or require explicit selection of children to transfer?
- Should partial transfers be allowed?

### 3. Multi-tenancy
- Do different users/organizations need different container hierarchies?
- Separate configuration per tenant?
- Shared vs isolated container pools?

### 4. History/Audit
- Full audit trail of all container movements and status changes?
- Retention policy for historical data?
- Real-time vs batch tracking?

### 5. Real-time Tracking
- For Variable types (Aircraft, ULD), GPS/location tracking integration needed?
- Integration with IoT devices/sensors?
- Update frequency requirements?

### 6. Conflict Handling
- What happens if container is already "Filled" and someone tries to add more items?
- Validation rules for concurrent modifications?
- Locking mechanism needed?

### 7. Business Rules
- Can a ULD be in multiple locations simultaneously? (should be no)
- Can Items exist without a parent container?
- What happens to child containers when parent is deleted?

---

## Discussion Notes

### Session 1 - February 1, 2026
- Initial requirements gathered
- Proposed architecture presented
- Awaiting feedback on open questions
- Next steps: Review and refine based on answers

### Session 2 - February 1, 2026
**Key Decision: User-Facing Labels vs System Implementation**

- **User Action**: User creates a "Warehouse" (this is the label/type they see and work with)
- **System Behavior**: Behind the scenes, system creates a `Container` object with:
  - `type: 'Warehouse'`
  - `movementType: 'Fixed'` (automatically set based on container type)
  
**Implementation Details:**
```typescript
// When user clicks "Create Warehouse"
const createWarehouse = (userInput: { name: string, code: string }) => {
  const container: Container = {
    id: generateId(),
    type: 'Warehouse',
    movementType: 'Fixed', // Auto-assigned based on type
    name: userInput.name,
    code: userInput.code,
    status: 'Created',
    allowedActions: getActionsForType('Warehouse'),
    allowedChildTypes: ['Location', 'ULD', 'Items'],
    // ... other fields
  };
  
  return createContainer(container);
};
```

**User Perspective:**
- User sees: "Warehouse", "Location", "ULD", "Aircraft", "Items"
- User doesn't need to know about "Fixed" vs "Variable" movement types
- Movement type is abstracted away as a system concern

**System Perspective:**
- Maintains `movementType` as internal property
- Uses it for validation (e.g., only Variable types can be Transferred)
- Enforces business rules based on movement type

---

## Implementation Phases

### Phase 1: Core Data Model ✅ COMPLETED
- [x] Define TypeScript interfaces
- [x] Create container type configuration structure
- [x] Implement hierarchy rules validation
- [x] Define custom fields schema

### Phase 2: Type Configuration UI ✅ COMPLETED
- [x] Container type configuration dashboard
- [x] Action configuration with labels
- [x] Role-based access control
- [x] Custom fields management
- [x] Organization scoping

### Phase 3: Instance Management (IN PROGRESS)
- [ ] Container instance creation UI
- [ ] Dynamic form builder based on custom fields
- [ ] Parent-child relationship selector
- [ ] Hierarchical tree view for instances
- [ ] Instance CRUD operations

### Phase 4: Advanced Features
- [ ] Transfer functionality
- [ ] Capacity management
- [ ] Location tracking (Variable types)
- [ ] Audit logging
- [ ] Bulk operations

### Phase 5: API Integration
- [ ] Backend API endpoints
- [ ] Real-time data synchronization
- [ ] Validation and business rules
- [ ] Multi-tenancy support

---

## Related Files

- **Load Plan UI:** `pages/emc/emccontainer/emcLoadPlan.vue`
- **Type Configuration:** `pages/emc/emccontainer/emcContainerConfig.vue` ✅
- **Design Document:** `docs/container-management-system-design.md` ✅
- **Instance Management:** `pages/emc/emccontainer/emcContainerInstances.vue` (TO BE CREATED)

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-02-01 | 1.0 | Initial draft created | System |
| Current | 2.0 | Added Session 3: Organization-level configuration, type vs instance separation | System |

---

## Session 3: Organization-Level Configuration & Instance Management

### Discussion Points

**1. Organization Scope**
- Configuration needs to support multiple organizations (multi-tenancy)
- Each organization should have independent type configurations
- Container instances belong to organizations

**2. Type vs Instance Separation**
- **Container Type Configuration:** Blueprint that defines structure
  - Actions available
  - Required roles
  - Custom fields to capture
  - Hierarchy rules
  - Capacity limits
- **Container Instances:** Actual containers created from types
  - Specific warehouse in Dallas
  - Location A-12-03 in Dallas warehouse
  - ULD ABC123 of type AKE

**3. Multiple Instances**
- Users need to create many containers of the same type
- One organization might have:
  - 5 warehouses in different cities
  - 100 locations per warehouse
  - 200 ULDs in circulation
- Type configuration applies to ALL instances of that type

**4. Type-Based Attributes**
- Container TYPE determines what fields are captured
- Examples:
  - **Warehouse:** address, manager ID, security level, temperature controlled
  - **Location:** zone code, aisle number, level, location type (Rack/Bin/Pallet)
  - **ULD:** ULD type (AKE/LD3/etc), serial number, owner, physical condition
  - **Aircraft:** aircraft type, registration, flight number, cargo hold config
  - **Items:** SKU, weight, volume, hazmat flag, fragile

### Data Model Evolution

```typescript
// Organization entity
interface Organization {
  id: string;
  name: string;
  code: string;
}

// Container Type Configuration (one per type per organization)
interface ContainerTypeConfig {
  id: string;
  organizationId: string;        // Links to organization
  type: string;                   // Warehouse, Location, ULD, Aircraft, Items
  label: string;                  // Display name
  movementType: 'Fixed' | 'Variable';
  icon: string;
  color: string;
  description: string;
  allowedChildTypes: string[];
  canBeContainedIn: string[];
  maxChildrenAllowed: number | null;
  actions: ContainerAction[];
  defaultCapacity: {...};
  customFields: CustomField[];    // DEFINES what fields to capture
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Custom field definition
interface CustomField {
  name: string;                   // Field identifier (address, zone, uldType)
  label: string;                  // User-facing label
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'checkbox';
  required: boolean;
  options?: string[];             // For select type
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// Container Instance (many per type)
interface ContainerInstance {
  id: string;
  organizationId: string;
  typeId: string;                 // References ContainerTypeConfig.id
  type: string;                   // Denormalized (Warehouse, Location, etc)
  parentId?: string | null;       // For parent-child relationships
  name: string;                   // User-assigned name (e.g., "Dallas Warehouse")
  code?: string;                  // Optional code (e.g., "DFW-WH-01")
  status: string;                 // Current state (Created, Open, Filled, Closed)
  attributes: Record<string, any>; // Dynamic attributes from type's customFields
  currentCapacity: {
    weight: number;
    volume: number;
    items: number;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Example Scenarios

**Scenario 1: Creating a Warehouse**
1. Admin goes to "Create Container" → selects "Warehouse" type
2. System fetches Warehouse type config for organization
3. System generates dynamic form with fields from `customFields`:
   - Address (textarea, required)
   - Manager ID (text, optional)
   - Temperature Controlled (checkbox, optional)
   - Security Level (select: Standard/High/Maximum, required)
4. User fills form: "Dallas Central Warehouse", "123 Main St Dallas", etc.
5. System creates ContainerInstance with:
   - `type: "Warehouse"`
   - `typeId: "ct-warehouse-001"`
   - `name: "Dallas Central Warehouse"`
   - `attributes: { address: "123 Main St...", securityLevel: "High", ... }`

**Scenario 2: Creating Locations in Warehouse**
1. User selects "Dallas Central Warehouse" as parent
2. Clicks "Add Location"
3. System shows Location type's custom fields:
   - Zone Code (text, required)
   - Aisle Number (text, required)
   - Storage Level (number, optional, 1-20)
   - Location Type (select: Rack/Bin/Pallet/Floor Space, required)
4. User creates multiple locations: "A-01-01", "A-01-02", "A-02-01", etc.
5. Each instance links to parent via `parentId`

**Scenario 3: Hierarchy Validation**
- System checks type config: "Location" `canBeContainedIn: ['Warehouse']`
- Validates: selected parent is Warehouse type ✅
- Creates instance with proper parent-child link

### UI Requirements

**1. Type Configuration Page** ✅ COMPLETED
- Current implementation: `emcContainerConfig.vue`
- Manages type definitions
- Configures actions, roles, custom fields
- Organization-scoped

**2. Instance Management Page** (TO BE CREATED)
- Browse/search container instances
- Hierarchical tree view
- Create new instances with dynamic forms
- Edit/delete instances
- Parent-child relationship management

**3. Instance Creation Dialog** (TO BE CREATED)
- Type selector
- Parent container selector (with type validation)
- Dynamic form builder based on selected type's customFields
- Validates required fields
- Shows default values from type config

**4. Hierarchical Tree View** (TO BE CREATED)
- Organization → Warehouses → Locations → ULDs → Items
- Expand/collapse nodes
- Search and filter
- Context menu for actions (Open, Fill, Close, Transfer)
- Drag-and-drop for transfers (with validation)

### API Endpoints (Proposed)

```typescript
// Type Configuration
GET    /api/organizations/{orgId}/container-types
GET    /api/organizations/{orgId}/container-types/{typeId}
PUT    /api/organizations/{orgId}/container-types/{typeId}

// Container Instances
GET    /api/organizations/{orgId}/containers              // List all
GET    /api/organizations/{orgId}/containers/{id}         // Get one
POST   /api/organizations/{orgId}/containers              // Create
PUT    /api/organizations/{orgId}/containers/{id}         // Update
DELETE /api/organizations/{orgId}/containers/{id}         // Delete

// Hierarchy queries
GET    /api/organizations/{orgId}/containers/{id}/children
GET    /api/organizations/{orgId}/containers/{id}/ancestors
GET    /api/organizations/{orgId}/containers/tree         // Full hierarchy

// Actions
POST   /api/organizations/{orgId}/containers/{id}/actions/{action}
```

### Next Steps

1. ✅ Update ContainerTypeConfig with organization scope
2. ✅ Add customFields management to configuration UI
3. ✅ Update design document with Session 3 notes
4. 🔲 Create ContainerInstance management page
5. 🔲 Build dynamic form builder component
6. 🔲 Implement hierarchical tree view
7. 🔲 Add parent-child relationship validation
8. 🔲 Create instance CRUD operations

---

## Next Meeting Topics

1. Review instance management UI mockups
2. Discuss dynamic form builder implementation
3. Define validation rules for parent-child relationships
4. Review API endpoint design
5. Decide on tree view library/component
6. Plan bulk operations (import multiple containers)
7. Discuss instance transfer workflow
**Notes:**
- This is a living document
- Update after each discussion
- Track decisions and rationale
- Link to implementation PRs/commits
