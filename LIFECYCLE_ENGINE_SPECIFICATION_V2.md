# EMC Generic Multi-Dimensional Lifecycle Engine - Implementation Specification

**Version:** 2.0 (System-Integrated)  
**Date:** February 22, 2026  
**Status:** READY FOR IMPLEMENTATION  
**Target:** Single File: `emcLifeCycleEngine.ts`

---

## 🎯 Executive Summary

Build a **metadata-driven lifecycle engine** that:
- Lives in a **SINGLE FILE**: `emcLifeCycleEngine.ts`
- Integrates with **existing** `emcCollection` and `configs` collections
- Separates UI logic (configs) from lifecycle logic (rules)
- Uses config.`engineAction` to map to lifecycleRules.`action`
- Supports multi-dimensional state transitions
- Handles parent-child relationships
- Logs all transitions to audit trail
- Supports role-based access and override mode

---

## 📊 System Architecture

### Current System Integration

```
UI Layer (Nuxt/Vue)
    ↓
Config Collection (UI Metadata)
├─ actions[].engineAction → Maps to lifecycle engine
├─ actions[].roles → UI visibility only
└─ actions[].attachableContainers → UI display only

    ↓
emcLifeCycleEngine.ts (SINGLE FILE)
├─ Load rule from lifecycleRules where action=engineAction
├─ Validate against lifecycleRules (not config)
├─ Execute transitions using rule logic
└─ Update emcCollection & write audit

    ↓
Database Layer
├─ emcCollection (container state)
├─ lifecycleRules (transition rules)
├─ lifecycleStates (valid states)
└─ lifecycleAudit (audit trail)
```

**Key Principle:** Config is UI-only. Rules drive execution.

---

## 📁 Database Collections

### 1. emcCollection (EXISTING - EXTENDED)

**Current Fields (Keep As-Is):**
```javascript
{
  _id: ObjectId,
  id: string,
  organizationId: number,
  label: string,
  category: string,
  type: string,           // "Warehouse" | "ULD" | "Item"
  description: string,
  typeData: object,
  actions: [],
  createdAt: Date,
  updatedAt: Date
}
```

**New Fields to Add:**
```javascript
{
  // Multi-dimensional state dimensions
  lifecycle: string,      // DRAFT | READY | ACTIVE | CLOSED | ARCHIVED
  assignment: string,     // NONE | LINKED (optional per type)
  inventory: string,      // NA | EMPTY | PLANNING | LOADED | RECONCILED (optional)
  location: string,       // NA | WAREHOUSE | FLIGHT (optional)
  control: string,        // NA | UNLOCKED | SEALED | OPENED | LOCKED (optional)
  operation: string,      // NA | SCHEDULED | PLANNING | LOADING | IN_FLIGHT | LANDING | RECONCILING | COMPLETED (optional)
  
  // Relationships
  parentId: ObjectId | null,     // Parent container reference
  childIds: ObjectId[],          // Child container references
  
  // Version tracking
  currentStateVersion: number,   // For optimistic locking
  stateHistory: [{               // Lightweight history
    dimension: string,
    value: string,
    changedAt: Date,
    changedBy: string
  }]
}
```

**Migration Script:**
```javascript
db.emcCollection.updateMany(
  {},
  {
    $set: {
      lifecycle: "DRAFT",
      assignment: "NONE",
      inventory: "NA",
      location: "NA",
      control: "NA",
      operation: "NA",
      parentId: null,
      childIds: [],
      currentStateVersion: 1,
      stateHistory: []
    }
  }
)
```

---

### 2. Config Collection (EXISTING - METADATA ADDITION)

**Keep existing fields:**
```javascript
{
  organizationId: number,
  configs: [
    {
      id: string,
      label: string,
      category: string,
      type: string,           // "Warehouse" | "ULD" | "Item"
      description: string,
      icon: string,
      imageUrl: string,
      canContain: string[],   // Which types can be children
      masterActions: {},      // Master-level actions
      actions: []             // Detail-level actions
    }
  ]
}
```

**Action Structure (NEW):**
```javascript
{
  id: string,               // "attach" | "detach" | "close" | ...
  label: string,            // "Attach" | "Detach" | "Close" | ...
  description: string,      // UI description
  
  // ⭐ CRITICAL: Map to lifecycle engine
  engineAction: string,     // Must match lifecycleRules.action
  
  roles: string[],          // ["Admin", "Manager"] - UI visibility only
  attachableContainers: string[],  // UI hint: which types can be attached
  
  // UI metadata (not used by engine)
  icon: string,
  category: string,
  disabled: boolean
}
```

**Example Config:**
```javascript
{
  id: "warehouse-config",
  type: "Warehouse",
  actions: [
    {
      id: "attach",
      label: "Attach to Parent",
      engineAction: "Attach",        // ← Engine looks for this
      roles: ["Admin", "Manager"],
      attachableContainers: ["Warehouse"],
      icon: "mdi-link"
    },
    {
      id: "detach",
      label: "Detach from Parent",
      engineAction: "Detach",        // ← Engine looks for this
      roles: ["Admin"],
      icon: "mdi-link-off"
    },
    {
      id: "close",
      label: "Close & Complete",
      engineAction: "Close",         // ← Engine looks for this
      roles: ["Admin"],
      icon: "mdi-check-bold"
    }
  ]
}
```

---

### 3. lifecycleStates (NEW)

**Purpose:** Master list of valid states per type and dimension

```javascript
{
  _id: ObjectId,
  entityType: string,           // "Warehouse" | "ULD" | "Item" | "ANY"
  dimension: string,            // "lifecycle" | "assignment" | "inventory" | ...
  code: string,                 // "DRAFT" | "READY" | "ACTIVE" | ...
  label: string,                // "Draft" | "Ready" | "Active" | ...
  description: string,
  isInitial: boolean,           // true = entity starts here
  isTerminal: boolean,          // true = cannot transition out
  order: number,                // Display sequence
  isActive: boolean,            // Soft delete
  version: number,
  createdAt: Date,
  updatedAt: Date
}
```

**Sample Seeds: Warehouse Type**
```javascript
// Lifecycle dimension
[
  {
    entityType: "Warehouse",
    dimension: "lifecycle",
    code: "DRAFT",
    label: "Draft",
    isInitial: true,
    isTerminal: false,
    order: 0
  },
  {
    entityType: "Warehouse",
    dimension: "lifecycle",
    code: "READY",
    label: "Ready",
    isInitial: false,
    isTerminal: false,
    order: 1
  },
  {
    entityType: "Warehouse",
    dimension: "lifecycle",
    code: "ACTIVE",
    label: "Active",
    isInitial: false,
    isTerminal: false,
    order: 2
  },
  {
    entityType: "Warehouse",
    dimension: "lifecycle",
    code: "CLOSED",
    label: "Closed",
    isInitial: false,
    isTerminal: false,
    order: 3
  },
  {
    entityType: "Warehouse",
    dimension: "lifecycle",
    code: "ARCHIVED",
    label: "Archived",
    isInitial: false,
    isTerminal: true,
    order: 4
  }
]

// Assignment dimension (Warehouse-specific)
[
  {
    entityType: "Warehouse",
    dimension: "assignment",
    code: "NONE",
    label: "Not Linked",
    isInitial: true,
    isTerminal: false,
    order: 0
  },
  {
    entityType: "Warehouse",
    dimension: "assignment",
    code: "LINKED",
    label: "Linked to Parent",
    isInitial: false,
    isTerminal: false,
    order: 1
  }
]

// Inventory dimension (optional per type)
[
  {
    entityType: "ANY",
    dimension: "inventory",
    code: "NA",
    label: "Not Applicable",
    isInitial: true,
    order: 0
  },
  {
    entityType: "ANY",
    dimension: "inventory",
    code: "EMPTY",
    label: "Empty",
    order: 1
  },
  {
    entityType: "ANY",
    dimension: "inventory",
    code: "PLANNING",
    label: "Planning",
    order: 2
  },
  {
    entityType: "ANY",
    dimension: "inventory",
    code: "LOADED",
    label: "Loaded",
    order: 3
  },
  {
    entityType: "ANY",
    dimension: "inventory",
    code: "RECONCILED",
    label: "Reconciled",
    order: 4
  }
]
```

---

### 4. lifecycleRules (NEW)

**Purpose:** All lifecycle transition rules

```javascript
{
  _id: ObjectId,
  
  // Identity
  action: string,               // "Attach" | "Detach" | "Close" | "Activate" | ...
  entityType: string,           // "Warehouse" | "ULD" | "Item" | "ANY"
  
  // Access Control
  allowedRoles: string[],       // ["Admin", "Manager", "Operator"]
  
  // Preconditions (current entity state)
  preConditions: [
    {
      dimension: string,        // "lifecycle"
      allowedValues: string[]   // ["READY", "ACTIVE"]
    }
  ],
  
  // Parent state requirements
  crossEntityConditions: [
    {
      parentType: string,       // "Warehouse" (optional)
      dimension: string,        // "lifecycle"
      allowedValues: string[]   // ["READY", "ACTIVE"]
    }
  ],
  
  // Children state requirements
  childConditions: [
    {
      dimension: string,        // "lifecycle"
      allowedValues: string[],  // ["ACTIVE"]
      matchType: "ALL" | "ANY"  // ALL = every child, ANY = at least one
    }
  ],
  
  // State updates (what changes)
  postUpdates: [
    {
      target: "SELF" | "PARENT" | "CHILDREN" | "ALL_DESCENDANTS",
      dimension: string,        // "lifecycle"
      value: string             // "ACTIVE"
    }
  ],
  
  // Cascade behavior
  cascade: boolean,             // true = apply to children recursively
  
  // Activation & versioning
  isActive: boolean,
  version: number,
  priority: number,             // Higher = evaluated first
  
  // Metadata
  description: string,
  examples: string[],
  
  createdAt: Date,
  updatedAt: Date
}
```

**Sample Rule 1: Attach (Warehouse to Parent)**
```javascript
{
  action: "Attach",             // ← Maps to config.engineAction
  entityType: "Warehouse",
  allowedRoles: ["Admin", "Manager"],
  
  preConditions: [
    {
      dimension: "lifecycle",
      allowedValues: ["READY", "ACTIVE"]
    }
  ],
  
  crossEntityConditions: [
    {
      parentType: "Warehouse",
      dimension: "lifecycle",
      allowedValues: ["READY", "ACTIVE"]
    }
  ],
  
  childConditions: [],          // No child conditions for attach
  
  postUpdates: [
    {
      target: "SELF",
      dimension: "assignment",
      value: "LINKED"
    },
    {
      target: "SELF",
      dimension: "lifecycle",
      value: "ACTIVE"
    },
    {
      target: "PARENT",
      dimension: "lifecycle",
      value: "ACTIVE"
      // Conditional: only if parent is READY
    }
  ],
  
  cascade: false,
  isActive: true,
  version: 1,
  priority: 10,
  
  description: "Attach a warehouse to its parent warehouse"
}
```

**Sample Rule 2: Detach**
```javascript
{
  action: "Detach",             // ← Maps to config.engineAction
  entityType: "Warehouse",
  allowedRoles: ["Admin"],
  
  preConditions: [
    {
      dimension: "lifecycle",
      allowedValues: ["ACTIVE"]
    },
    {
      dimension: "assignment",
      allowedValues: ["LINKED"]
    }
  ],
  
  crossEntityConditions: [],
  childConditions: [],
  
  postUpdates: [
    {
      target: "SELF",
      dimension: "assignment",
      value: "NONE"
    }
    // Parent status computed: if remainingChildren === 0, ACTIVE → READY
  ],
  
  cascade: false,
  isActive: true,
  version: 1,
  priority: 10,
  
  description: "Detach a warehouse from its parent warehouse"
}
```

**Sample Rule 3: Close with Cascade**
```javascript
{
  action: "Close",              // ← Maps to config.engineAction
  entityType: "Warehouse",
  allowedRoles: ["Admin"],
  
  preConditions: [
    {
      dimension: "lifecycle",
      allowedValues: ["ACTIVE"]
    }
  ],
  
  postUpdates: [
    {
      target: "SELF",
      dimension: "lifecycle",
      value: "CLOSED"
    }
  ],
  
  cascade: true,                // ← Recurse to all descendants
  isActive: true,
  version: 1,
  priority: 10,
  
  description: "Close container and cascade to all children"
}
```

---

### 5. lifecycleAudit (NEW)

**Purpose:** Immutable audit trail

```javascript
{
  _id: ObjectId,
  
  // Entity information
  entityId: ObjectId,           // Reference to emcCollection._id
  entityType: string,           // "Warehouse" | "ULD" | "Item"
  entityLabel: string,          // Display name
  
  // Relationships
  parentId: ObjectId | null,
  parentLabel: string | null,
  childrenIds: ObjectId[],      // Affected children
  childrenLabels: string[],
  
  // Action details
  action: string,               // "Attach" | "Detach" | "Close" | ...
  ruleId: string,               // Which rule was executed
  
  // State changes
  previousState: {              // Before action
    lifecycle: string | null,
    assignment: string | null,
    inventory: string | null,
    location: string | null,
    control: string | null,
    operation: string | null
  },
  
  newState: {                   // After action
    lifecycle: string | null,
    assignment: string | null,
    inventory: string | null,
    location: string | null,
    control: string | null,
    operation: string | null
  },
  
  changedDimensions: string[],  // ["lifecycle", "assignment"]
  
  // User & context
  performedBy: {
    userId: string,
    userName: string,
    userCode: string,
    role: string
  },
  
  organizationId: number,
  
  // Override info
  validationSkipped: boolean,   // true if override used
  overrideReason: string,
  
  // Cascade info
  cascadeInfo: {
    cascaded: boolean,
    affectedCount: number,
    childUpdates: [{
      childId: ObjectId,
      childLabel: string,
      previousState: object,
      newState: object
    }]
  },
  
  // Status
  success: boolean,
  errorCode: string | null,
  errorMessage: string | null,
  
  // Timing
  requestedAt: Date,
  executedAt: Date,
  transactionId: string
}
```

---

## 🔧 Engine Function Signature

### executeLifecycleAction()

```typescript
async executeLifecycleAction({
  entityId: string,                    // Entity ID to act upon
  action: string,                      // engineAction from config
  userId: string,                      // User performing action
  userName: string,                    // User display name
  userRole: string,                    // User role (Admin, Manager, ...)
  userCode: string,                    // User code/employee ID
  
  parentId?: string,                   // Parent entity (if applicable)
  childrenIds?: string[],              // Children entities (if applicable)
  
  reason?: string,                     // Free-text reason
  override?: boolean,                  // true = bypass conditions
  overrideReason?: string,             // Why override needed
  
  organizationId?: number,             // Tenant ID
  dryRun?: boolean,                    // Validate only, don't commit
  
  // For testing
  db?: any,                            // Injected MongoDB client
  session?: any                        // Injected session
}): Promise<ExecutionResult>
```

### Response Types

**Success:**
```typescript
{
  success: true,
  action: "Attach",
  entityId: "ware-001",
  entityType: "Warehouse",
  
  previousState: {
    lifecycle: "READY",
    assignment: "NONE",
    inventory: "NA",
    location: "WAREHOUSE",
    control: "NA",
    operation: "NA"
  },
  
  newState: {
    lifecycle: "ACTIVE",
    assignment: "LINKED",
    inventory: "NA",
    location: "WAREHOUSE",
    control: "NA",
    operation: "NA"
  },
  
  changedDimensions: ["lifecycle", "assignment"],
  cascade: {
    cascaded: false,
    affectedCount: 1
  },
  
  auditId: "ObjectId",
  message: "Successfully attached Warehouse to Parent"
}
```

**Error:**
```typescript
{
  success: false,
  errorCode: "PRECONDITION_FAILED" | "ROLE_DENIED" | "INVALID_STATE" | "CASCADE_ERROR",
  action: "Attach",
  entityId: "ware-001",
  entityType: "Warehouse",
  
  dimension?: "lifecycle",
  currentValue?: "DRAFT",
  expectedValues?: ["READY", "ACTIVE"],
  
  message: "Attach requires lifecycle to be READY or ACTIVE, current is DRAFT",
  auditId: "ObjectId"
}
```

---

## 🔄 Execution Flow (14 Steps)

```
STEP 1: Initialize & Validate Input
  ├─ Validate required fields
  ├─ Load user context
  └─ Create requestId for tracing

STEP 2: Load Entity
  ├─ Query emcCollection where id=entityId
  ├─ If not found → ERROR: ENTITY_NOT_FOUND
  └─ Store current state for audit

STEP 3: Load Rule
  ├─ Query lifecycleRules where:
  │  ├─ action = input.action ← Maps to config.engineAction
  │  ├─ entityType matches entity.type
  │  ├─ isActive = true
  │  └─ priority DESC
  ├─ If no rule → ERROR: ACTION_NOT_DEFINED
  └─ Load reference lifecycleStates for validation

STEP 4: Validate Role
  ├─ If override=true AND userRole='Admin':
  │  ├─ Log override
  │  └─ SKIP to STEP 8
  ├─ Else if userRole NOT IN rule.allowedRoles:
  │  └─ ERROR: ROLE_DENIED
  └─ CONTINUE

STEP 5: Validate Preconditions
  ├─ For each condition in rule.preConditions:
  │  ├─ Get entity[dimension]
  │  ├─ Check if in allowedValues
  │  ├─ If NOT match:
  │  │  └─ ERROR: PRECONDITION_FAILED + details
  │  └─ CONTINUE
  └─ All preconditions passed

STEP 6: Validate Cross-Entity Conditions
  ├─ For each condition in rule.crossEntityConditions:
  │  ├─ Load parent from emcCollection
  │  ├─ Check parent[dimension] in allowedValues
  │  ├─ If fail:
  │  │  └─ ERROR: PARENT_STATE_INVALID
  │  └─ CONTINUE
  └─ Parent validation passed

STEP 7: Validate Child Conditions
  ├─ Load children from emcCollection
  ├─ For each condition in rule.childConditions:
  │  ├─ If matchType="ALL":
  │  │  ├─ Every child[dimension] must be in allowedValues
  │  │  └─ If ANY fail → ERROR: CHILD_STATE_INVALID
  │  ├─ If matchType="ANY":
  │  │  ├─ At least ONE child[dimension] in allowedValues
  │  │  └─ If none match → ERROR: NO_VALID_CHILDREN
  │  └─ CONTINUE
  └─ Child validation passed

STEP 8: Prepare State Updates
  ├─ For each update in rule.postUpdates:
  │  ├─ Determine target (SELF, PARENT, CHILDREN, ALL_DESCENDANTS)
  │  ├─ Validate new state exists in lifecycleStates
  │  └─ Add to updateQueue
  └─ All updates prepared

STEP 9: Handle Cascade
  ├─ If rule.cascade = true:
  │  ├─ Recursively find all descendants
  │  ├─ For each descendant level, apply updates
  │  └─ Track affected entities
  └─ Cascade tree built

STEP 10: Start Transaction
  ├─ Begin MongoDB session transaction
  ├─ Save transactionId for audit
  └─ If dryRun=true: SKIP to STEP 13

STEP 11: Apply Updates
  ├─ For each update in updateQueue:
  │  ├─ Execute updateOne() in transaction:
  │  │  {
  │  │    $set: {
  │  │      [dimension]: value,
  │  │      updatedAt: new Date(),
  │  │      currentStateVersion: increment
  │  │    },
  │  │    $push: {
  │  │      stateHistory: {dimension, value, changedAt, changedBy}
  │  │    }
  │  │  }
  │  └─ Verify matched/modified counts
  └─ All updates applied

STEP 12: Commit Transaction
  ├─ session.commitTransaction()
  ├─ If commit fails → ABORT + ERROR
  └─ Transaction committed

STEP 13: Create Audit Record
  ├─ Build lifecycleAudit document
  ├─ Insert into lifecycleAudit
  └─ Get auditId

STEP 14: Return Success Response
  ├─ Build response with all details
  └─ RETURN response

ERROR HANDLING:
  ├─ At any step, if validation fails:
  │  ├─ Abort transaction (if started)
  │  ├─ Create audit record (success=false)
  │  └─ RETURN error response
  └─ All decisions logged
```

---

## 📝 Implementation File Structure

### emcLifeCycleEngine.ts Contents

```typescript
// 1. Imports & Type Definitions (50 lines)
// 2. Main Function: executeLifecycleAction() (100 lines)
// 3. Helper: Load Rule (30 lines)
// 4. Helper: Load Entity (20 lines)
// 5. Helper: Validate Role (20 lines)
// 6. Helper: Validate Preconditions (40 lines)
// 7. Helper: Validate Cross-Entity (30 lines)
// 8. Helper: Validate Children (50 lines)
// 9. Helper: Prepare Updates (30 lines)
// 10. Helper: Build Cascade Tree (50 lines)
// 11. Helper: Apply Transaction Updates (40 lines)
// 12. Helper: Create Audit Record (40 lines)
// 13. Helper: Validate State Exists (20 lines)
// 14. Exports (10 lines)

// Total: ~500 lines in single file
```

**Key Exports:**
```typescript
export async function executeLifecycleAction(params): Promise<ExecutionResult>
export interface ExecutionResult
export interface ExecutionParams
export interface ValidatedRule
```

---

## 🔗 Config to Engine Mapping Example

### How config.engineAction Maps to Rule

**In Config Collection:**
```javascript
{
  id: "warehouse-config",
  type: "Warehouse",
  actions: [
    {
      id: "attach",
      label: "Attach to Parent",
      engineAction: "Attach",      // ← This string
      roles: ["Admin", "Manager"]
    }
  ]
}
```

**In lifecycleRules Collection:**
```javascript
{
  action: "Attach",               // ← Matches engineAction
  entityType: "Warehouse",
  allowedRoles: ["Admin", "Manager"],
  preConditions: [...],
  postUpdates: [...]
}
```

**Engine Lookup:**
```typescript
// User clicks "Attach" from config
const engineAction = config.actions.find(a => a.id === "attach").engineAction // "Attach"

// Engine looks for matching rule
const rule = await db.collection('lifecycleRules').findOne({
  action: engineAction,           // "Attach"
  entityType: entity.type,        // "Warehouse"
  isActive: true
})

// Execute rule
await executeLifecycleAction({
  action: engineAction,           // "Attach"
  ...
})
```

---

## 📊 Data Flow Diagram

```
User Interface (Nuxt/Vue)
    │
    ├─ Reads: config.actions[].engineAction
    │         config.actions[].roles (for UI visibility)
    │         config.attachableContainers (for UI display)
    │
    └─ Calls: POST /api/lifecycle-action
    │         body: { action: "Attach", entityId: "...", ... }
    │
    ↓
emcLifeCycleEngine.ts
    │
    ├─ Load rule: lifecycleRules.findOne(action: "Attach", entityType: "Warehouse")
    │
    ├─ Validate: preConditions, crossEntityConditions, childConditions
    │
    ├─ Update: emcCollection (SELF, PARENT, CHILDREN, ALL_DESCENDANTS)
    │
    └─ Audit: lifecycleAudit.insertOne(...)
    │
    ↓
Database
    ├─ emcCollection (state changes)
    ├─ lifecycleRules (rule definitions)
    ├─ lifecycleStates (state validation)
    └─ lifecycleAudit (audit trail)
```

---

## 🌱 Sample Seed: Complete Warehouse Lifecycle Setup

### 1. lifecycleStates Seeds

```javascript
// Warehouse lifecycle dimension
db.lifecycleStates.insertMany([
  // Lifecycle
  { entityType: "Warehouse", dimension: "lifecycle", code: "DRAFT", label: "Draft", isInitial: true, order: 0 },
  { entityType: "Warehouse", dimension: "lifecycle", code: "READY", label: "Ready", isInitial: false, order: 1 },
  { entityType: "Warehouse", dimension: "lifecycle", code: "ACTIVE", label: "Active", isInitial: false, order: 2 },
  { entityType: "Warehouse", dimension: "lifecycle", code: "CLOSED", label: "Closed", isInitial: false, order: 3 },
  { entityType: "Warehouse", dimension: "lifecycle", code: "ARCHIVED", label: "Archived", isInitial: false, isTerminal: true, order: 4 },
  
  // Assignment
  { entityType: "Warehouse", dimension: "assignment", code: "NONE", label: "Not Linked", isInitial: true, order: 0 },
  { entityType: "Warehouse", dimension: "assignment", code: "LINKED", label: "Linked", isInitial: false, order: 1 },
  
  // Inventory
  { entityType: "ANY", dimension: "inventory", code: "NA", label: "N/A", isInitial: true, order: 0 },
  { entityType: "ANY", dimension: "inventory", code: "EMPTY", label: "Empty", order: 1 },
  { entityType: "ANY", dimension: "inventory", code: "PLANNING", label: "Planning", order: 2 },
  { entityType: "ANY", dimension: "inventory", code: "LOADED", label: "Loaded", order: 3 },
  { entityType: "ANY", dimension: "inventory", code: "RECONCILED", label: "Reconciled", order: 4 }
])
```

### 2. lifecycleRules Seeds

```javascript
db.lifecycleRules.insertMany([
  // ACTIVATE: DRAFT → READY
  {
    action: "Activate",
    entityType: "Warehouse",
    allowedRoles: ["Admin"],
    preConditions: [{ dimension: "lifecycle", allowedValues: ["DRAFT"] }],
    postUpdates: [{ target: "SELF", dimension: "lifecycle", value: "READY" }],
    cascade: false,
    isActive: true,
    version: 1,
    priority: 10
  },
  
  // ATTACH: Parent READY→ACTIVE, Self READY→ACTIVE, assignment NONE→LINKED
  {
    action: "Attach",
    entityType: "Warehouse",
    allowedRoles: ["Admin", "Manager"],
    preConditions: [{ dimension: "lifecycle", allowedValues: ["READY", "ACTIVE"] }],
    crossEntityConditions: [{ 
      parentType: "Warehouse",
      dimension: "lifecycle",
      allowedValues: ["READY", "ACTIVE"]
    }],
    postUpdates: [
      { target: "SELF", dimension: "assignment", value: "LINKED" },
      { target: "SELF", dimension: "lifecycle", value: "ACTIVE" },
      { target: "PARENT", dimension: "lifecycle", value: "ACTIVE" }
    ],
    cascade: false,
    isActive: true,
    version: 1,
    priority: 10
  },
  
  // DETACH: assignment LINKED→NONE, parent ACTIVE→READY if no kids
  {
    action: "Detach",
    entityType: "Warehouse",
    allowedRoles: ["Admin"],
    preConditions: [
      { dimension: "lifecycle", allowedValues: ["ACTIVE"] },
      { dimension: "assignment", allowedValues: ["LINKED"] }
    ],
    postUpdates: [
      { target: "SELF", dimension: "assignment", value: "NONE" }
    ],
    cascade: false,
    isActive: true,
    version: 1,
    priority: 10
  },
  
  // CLOSE: ACTIVE→CLOSED, cascade to children
  {
    action: "Close",
    entityType: "Warehouse",
    allowedRoles: ["Admin"],
    preConditions: [{ dimension: "lifecycle", allowedValues: ["ACTIVE"] }],
    postUpdates: [
      { target: "SELF", dimension: "lifecycle", value: "CLOSED" }
    ],
    cascade: true,
    isActive: true,
    version: 1,
    priority: 10
  },
  
  // ARCHIVE: Any→ARCHIVED, recursive cascade
  {
    action: "Archive",
    entityType: "Warehouse",
    allowedRoles: ["Admin"],
    preConditions: [],  // Any state
    postUpdates: [
      { target: "SELF", dimension: "lifecycle", value: "ARCHIVED" }
    ],
    cascade: true,
    isActive: true,
    version: 1,
    priority: 15
  }
])
```

### 3. Config Metadata (Updated)

```javascript
db.configs.updateOne(
  { organizationId: 12313 },
  {
    $set: {
      "configs.$[elem].actions": [
        {
          id: "activate",
          label: "Activate",
          engineAction: "Activate",
          roles: ["Admin"],
          icon: "mdi-play"
        },
        {
          id: "attach",
          label: "Attach to Parent",
          engineAction: "Attach",
          roles: ["Admin", "Manager"],
          attachableContainers: ["Warehouse"],
          icon: "mdi-link"
        },
        {
          id: "detach",
          label: "Detach",
          engineAction: "Detach",
          roles: ["Admin"],
          icon: "mdi-link-off"
        },
        {
          id: "close",
          label: "Close & Complete",
          engineAction: "Close",
          roles: ["Admin"],
          icon: "mdi-check-bold"
        },
        {
          id: "archive",
          label: "Archive",
          engineAction: "Archive",
          roles: ["Admin"],
          icon: "mdi-archive"
        }
      ]
    }
  },
  { arrayFilters: [{ "elem.type": "Warehouse" }] }
)
```

---

## 🧪 Unit Test Strategy

### Test 1: Role Validation
```typescript
test("Admin can execute Attach", async () => {
  const result = await executeLifecycleAction({
    entityId: "ware-001",
    action: "Attach",
    userRole: "Admin"
  })
  expect(result.success).toBe(true)
})

test("Operator cannot execute Attach", async () => {
  const result = await executeLifecycleAction({
    entityId: "ware-001",
    action: "Attach",
    userRole: "Operator"
  })
  expect(result.success).toBe(false)
  expect(result.errorCode).toBe("ROLE_DENIED")
})
```

### Test 2: Precondition Validation
```typescript
test("Attach requires READY or ACTIVE", async () => {
  const result = await executeLifecycleAction({
    entityId: "ware-draft",  // Current lifecycle: DRAFT
    action: "Attach",
    userRole: "Admin"
  })
  expect(result.success).toBe(false)
  expect(result.errorCode).toBe("PRECONDITION_FAILED")
  expect(result.dimension).toBe("lifecycle")
})
```

### Test 3: State Updates
```typescript
test("Attach updates both self and parent", async () => {
  const result = await executeLifecycleAction({
    entityId: "ware-001",
    action: "Attach",
    parentId: "ware-root",
    userRole: "Admin"
  })
  expect(result.success).toBe(true)
  expect(result.changedDimensions).toContain("lifecycle")
  expect(result.changedDimensions).toContain("assignment")
})
```

### Test 4: Cascade
```typescript
test("Close cascades to all children", async () => {
  const result = await executeLifecycleAction({
    entityId: "ware-001",
    action: "Close",
    userRole: "Admin"
  })
  expect(result.success).toBe(true)
  expect(result.cascade.cascaded).toBe(true)
  expect(result.cascade.affectedCount).toBeGreaterThan(1)
})
```

### Test 5: Override
```typescript
test("Admin can override preconditions", async () => {
  const result = await executeLifecycleAction({
    entityId: "ware-draft",
    action: "Attach",
    userRole: "Admin",
    override: true,
    overrideReason: "Emergency attachment"
  })
  expect(result.success).toBe(true)
})
```

---

## 🚀 Implementation Roadmap

### Phase 1: File Structure (Day 1)
- [ ] Create emcLifeCycleEngine.ts
- [ ] Define TypeScript interfaces
- [ ] Export main function

### Phase 2: Database Access (Day 1-2)
- [ ] MongoDB connection utilities
- [ ] Query helpers
- [ ] Transaction management

### Phase 3: Core Logic (Day 2-3)
- [ ] Load entity & rule
- [ ] Validation engine
- [ ] State update logic
- [ ] Cascade algorithm

### Phase 4: Audit & Error Handling (Day 3)
- [ ] Audit record creation
- [ ] Error response formatting
- [ ] Logging

### Phase 5: Testing & Documentation (Day 4)
- [ ] Unit tests
- [ ] Integration tests
- [ ] API endpoint wrapping
- [ ] Documentation

---

## 📋 Verification Checklist

Before deployment:

- [ ] Single file: emcLifeCycleEngine.ts created
- [ ] All logic inside single file (< 600 lines)
- [ ] No business logic hardcoded
- [ ] All transitions come from lifecycleRules
- [ ] All state updates in emcCollection
- [ ] Audit trail recording all transitions
- [ ] Override mode working for Admin
- [ ] MongoDB transactions implemented
- [ ] Role-based access control working
- [ ] All 5 lifecycle rules seeded
- [ ] All lifecycle states seeded
- [ ] Config.engineAction mapping verified
- [ ] 20+ unit tests passing
- [ ] Integration tests passing
- [ ] No errors on startup
- [ ] Performance acceptable (<500ms per action)

---

## 📚 Next Steps

1. **Create emcLifeCycleEngine.ts** with all logic
2. **Create database migrations** (lifecycleStates, lifecycleRules, lifecycleAudit)
3. **Create API endpoint** (POST /api/lifecycle-action)
4. **Update config collection** with engineAction fields
5. **Create comprehensive tests** (50+ test cases)
6. **Document usage** (API docs, examples)
7. **Deploy gradually** (phase rollout)

---

**Status:** SPECIFICATION COMPLETE  
**Ready for Implementation:** YES  
**Single File:** emcLifeCycleEngine.ts (~500 lines)  
**Complexity:** Medium (14-step engine, well-documented)

Generated: February 22, 2026  
Version: 2.0 (System-Integrated)
