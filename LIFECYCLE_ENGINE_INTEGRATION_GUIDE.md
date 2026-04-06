# EMC Lifecycle Engine - Integration Overview

**Version:** 2.0 - System Integrated  
**Date:** February 22, 2026  
**Status:** READY FOR DEPLOYMENT  
**All Logic:** Single File (`server/utils/emcLifeCycleEngine.ts`)

---

## 📦 Complete Deliverables Package

### Core Engine Files (3 files)

#### 1. **emcLifeCycleEngine.ts** (500 lines)
**Location:** `server/utils/emcLifeCycleEngine.ts`

- Main execution engine with 14-step validation flow
- All lifecycle rules loaded from MongoDB
- Role-based access control validation
- Pre/post condition checking
- Parent-child hierarchy support
- Cascade algorithm for hierarchical trees
- MongoDB transaction handling
- Audit trail creation
- Override support for admins

**Exports:**
```typescript
export async function executeLifecycleAction(params): Promise<ExecutionResult>
export interface ExecutionParams
export interface ExecutionResult
export interface ValidatedRule
```

#### 2. **lifecycle-action.post.ts** (150 lines)
**Location:** `server/api/emc/lifecycle-action.post.ts`

- HTTP endpoint wrapper for engine
- Session validation
- Request validation
- Response formatting
- Error handling

**Request:** `POST /api/emc/lifecycle-action`
```json
{
  "entityId": "ware-001",
  "action": "Attach",
  "parentId": "ware-root",
  "override": false
}
```

#### 3. **seed-lifecycle-engine.ts** (350 lines)
**Location:** `server/seeds/seed-lifecycle-engine.ts`

- Database initialization
- Collection creation
- Index creation
- Seed data insertion
- Schema migration

**Execution:** `npm run seed:lifecycle`

### Documentation Files (4 files)

#### 4. **LIFECYCLE_ENGINE_SPECIFICATION_V2.md** (500+ lines)
**Complete specification including:**
- System architecture
- Collection schemas
- Function signatures
- 14-step execution flow
- Sample rules and seeds
- Test strategy
- Implementation checklist

#### 5. **LIFECYCLE_ENGINE_MIGRATION_GUIDE.md** (400+ lines)
**Complete migration plan including:**
- 3-phase rollout strategy
- Pre-migration checklist
- Database migration steps
- Validation procedures
- Rollback scenarios
- Post-migration monitoring
- Success criteria

#### 6. **MILESTONE_LIFECYCLE_CURRENT_STATUS.md**
**Current system baseline documentation**

#### 7. **BACKUP_SNAPSHOT_2026-02-22.md**
**Exact system state snapshot with restore procedures**

---

## 🔗 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface (Vue)                      │
│  - emcContainer.vue displays containers                      │
│  - User clicks action (e.g., "Attach")                       │
│  - Action retrieved from config.actions[]                   │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│               API Layer (lifecycle-action.post.ts)           │
│  - POST /api/emc/lifecycle-action                            │
│  - Extract { entityId, action, parentId, ... }             │
│  - Validate user session                                    │
│  - Call executeLifecycleAction()                            │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│         Engine Core (emcLifeCycleEngine.ts)                 │
│  14-Step Validation Flow:                                   │
│  1. Load entity from emcCollection                          │
│  2. Load rule from lifecycleRules                           │
│  3. Validate role (allowedRoles)                            │
│  4. Validate preConditions (entity state)                   │
│  5. Validate crossEntityConditions (parent state)           │
│  6. Validate childConditions (children state)               │
│  7. Prepare state updates from postUpdates                  │
│  8. Build cascade tree if cascade=true                      │
│  9. Start MongoDB transaction                               │
│  10. Apply updates to emcCollection                         │
│  11. Commit transaction                                     │
│  12. Create lifecycleAudit record                           │
│  13. Return success response                                │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ emcCollection (MODIFIED)                            │   │
│  │ - lifecycle: "ACTIVE" (or DRAFT/READY/CLOSED/...)  │   │
│  │ - assignment: "LINKED" (or NONE)                    │   │
│  │ - inventory: "LOADED" (NA/EMPTY/PLANNING/...)       │   │
│  │ - location: "WAREHOUSE" (NA/WAREHOUSE/FLIGHT)       │   │
│  │ - control: "SEALED" (NA/UNLOCKED/SEALED/...)        │   │
│  │ - operation: "IN_FLIGHT" (NA/SCHEDULED/...)         │   │
│  │ - parentId, childIds, stateHistory, ...             │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ lifecycleRules (NEW)                                │   │
│  │ {action, entityType, allowedRoles, preConditions,   │   │
│  │  postUpdates, cascade, isActive, ...}               │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ lifecycleStates (NEW)                               │   │
│  │ {entityType, dimension, code, label, isInitial,     │   │
│  │  isTerminal, order, isActive, ...}                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ lifecycleAudit (NEW)                                │   │
│  │ {entityId, action, previousState, newState,         │   │
│  │  performedBy, cascadeInfo, transactionId, ...}      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ configs (MODIFIED)                                  │   │
│  │ Added: actions[].engineAction field                 │   │
│  │  - Maps "Attach" to lifecycleRules.action="Attach" │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Response to Client                         │
│  {                                                          │
│    success: true,                                           │
│    data: {                                                  │
│      action: "Attach",                                      │
│      entityId: "ware-001",                                  │
│      previousState: {...},                                  │
│      newState: {...},                                       │
│      changedDimensions: ["lifecycle", "assignment"],       │
│      cascade: {cascaded: false, affectedCount: 1},         │
│      auditId: "ObjectId"                                    │
│    }                                                        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Config to Engine Mapping

### How It Works

**Step 1: Config defines available actions**
```javascript
db.configs.findOne() returns {
  configs: [{
    type: "Warehouse",
    actions: [
      {
        id: "attach",
        label: "Attach to Parent",
        engineAction: "Attach",  // ← Maps to rule
        roles: ["Admin", "Manager"],
        icon: "mdi-link"
      },
      {
        id: "detach",
        label: "Detach",
        engineAction: "Detach",  // ← Maps to rule
        roles: ["Admin"]
      }
    ]
  }]
}
```

**Step 2: UI calls engine action**
```typescript
// User clicks "Attach" button
const action = config.actions.find(a => a.id === 'attach')
const result = await $fetch('/api/emc/lifecycle-action', {
  body: {
    entityId: 'ware-001',
    action: action.engineAction  // "Attach" ← Uses engineAction
  }
})
```

**Step 3: Engine loads matching rule**
```typescript
// Inside emcLifeCycleEngine.ts
const rule = await db.collection('lifecycleRules').findOne({
  action: "Attach",           // ← Matches engineAction
  entityType: "Warehouse",
  isActive: true
})

// Rule defines:
// - allowedRoles: ["Admin", "Manager"]
// - preConditions: [{dimension: "lifecycle", allowedValues: ["READY", "ACTIVE"]}]
// - postUpdates: [{target: "SELF", dimension: "lifecycle", value: "ACTIVE"}]
// - cascade: false
```

**Step 4: Engine validates and executes**
```typescript
// Validate: User role in allowedRoles ✓
// Validate: Entity.lifecycle in allowedValues ✓
// Update: Set entity.lifecycle = "ACTIVE", entity.assignment = "LINKED"
// Audit: Record action in lifecycleAudit collection
// Return: Success response to client
```

---

## 📚 Collection Schemas

### emcCollection (MODIFIED)

```javascript
{
  _id: ObjectId,
  
  // Original fields (preserved)
  id: string,                    // "ware-001"
  organizationId: number,        // 12313
  label: string,                 // "Warehouse A"
  category: string,              // "warehouse"
  type: string,                  // "Warehouse" | "ULD" | "Item"
  description: string,
  typeData: object,
  actions: [],
  createdAt: Date,
  updatedAt: Date,
  
  // NEW: Multi-dimensional state fields
  lifecycle: string,             // "DRAFT" | "READY" | "ACTIVE" | "CLOSED" | "ARCHIVED"
  assignment: string,            // "NONE" | "LINKED" 
  inventory: string,             // "NA" | "EMPTY" | "PLANNING" | "LOADED" | "RECONCILED"
  location: string,              // "NA" | "WAREHOUSE" | "FLIGHT"
  control: string,               // "NA" | "UNLOCKED" | "SEALED" | "OPENED" | "LOCKED"
  operation: string,             // "NA" | "SCHEDULED" | "PLANNING" | "LOADING" | "IN_FLIGHT" | "LANDING" | "RECONCILING" | "COMPLETED"
  
  // NEW: Relationships
  parentId: ObjectId | null,
  childIds: ObjectId[],
  
  // NEW: Version tracking
  currentStateVersion: number,
  stateHistory: [{
    dimension: string,           // "lifecycle", "assignment", ...
    value: string,               // New state value
    changedAt: Date,
    changedBy: string            // userId
  }]
}
```

### lifecycleRules (NEW)

```javascript
{
  _id: ObjectId,
  
  // Identity
  action: string,                // "Attach" | "Detach" | "Close" | ...
  entityType: string,            // "Warehouse" | "ULD" | "Item" | "ANY"
  
  // Access control
  allowedRoles: string[],        // ["Admin", "Manager"]
  
  // Preconditions (current entity)
  preConditions: [{
    dimension: string,           // "lifecycle"
    allowedValues: string[]      // ["READY", "ACTIVE"]
  }],
  
  // Parent state requirements
  crossEntityConditions: [{
    parentType?: string,         // "Warehouse" (optional)
    dimension: string,           // "lifecycle"
    allowedValues: string[]      // ["READY", "ACTIVE"]
  }],
  
  // Children state requirements
  childConditions: [{
    dimension: string,           // "lifecycle"
    allowedValues: string[],     // ["ACTIVE"]
    matchType: "ALL" | "ANY"    // ALL = every child, ANY = at least one
  }],
  
  // What actually changes
  postUpdates: [{
    target: "SELF" | "PARENT" | "CHILDREN" | "ALL_DESCENDANTS",
    dimension: string,           // "lifecycle"
    value: string                // "ACTIVE"
  }],
  
  // Cascade
  cascade: boolean,              // true = apply to children recursively
  
  // Metadata
  isActive: boolean,
  version: number,
  priority: number,              // Higher = evaluated first
  description: string
}
```

### lifecycleStates (NEW)

```javascript
{
  _id: ObjectId,
  
  entityType: string,            // "Warehouse" | "ANY"
  dimension: string,             // "lifecycle" | "assignment" | "inventory" | ...
  code: string,                  // "DRAFT" | "READY" | "ACTIVE" | ...
  label: string,                 // Display name
  description: string,           // Long description
  
  isInitial: boolean,            // true = entity starts here
  isTerminal: boolean,           // true = cannot transition out
  order: number,                 // Display sequence
  isActive: boolean,             // Soft delete
  
  version: number,
  createdAt: Date
}
```

### lifecycleAudit (NEW)

```javascript
{
  _id: ObjectId,
  
  // Entity info
  entityId: ObjectId,            // Reference to emcCollection._id
  entityType: string,            // "Warehouse" | "ULD" | "Item"
  entityLabel: string,           // Display name
  
  // Relationships affected
  parentId: ObjectId | null,
  childrenIds: ObjectId[],
  
  // Action details
  action: string,                // "Attach", "Detach", "Close", ...
  ruleId: ObjectId,              // Which rule was executed
  
  // State changes
  previousState: {
    lifecycle: string | null,
    assignment: string | null,
    inventory: string | null,
    location: string | null,
    control: string | null,
    operation: string | null
  },
  
  newState: {
    lifecycle: string | null,
    assignment: string | null,
    inventory: string | null,
    location: string | null,
    control: string | null,
    operation: string | null
  },
  
  changedDimensions: string[],   // e.g., ["lifecycle", "assignment"]
  
  // User context
  performedBy: {
    userId: string,
    userName: string,
    userCode: string,
    role: string
  },
  
  organizationId: number,
  
  // Override info
  validationSkipped: boolean,
  overrideReason: string | null,
  
  // Cascade info
  cascadeInfo: {
    cascaded: boolean,
    affectedCount: number,
    childUpdates: [{
      childId: ObjectId,
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

## 🎯 Quick Reference

### Add a New Lifecycle Action

**Step 1: Create rule in MongoDB**
```javascript
db.lifecycleRules.insertOne({
  action: "MyNewAction",
  entityType: "Warehouse",
  allowedRoles: ["Admin"],
  preConditions: [{...}],
  postUpdates: [{...}],
  cascade: false,
  isActive: true,
  version: 1,
  priority: 10
})
```

**Step 2: Add to config**
```javascript
db.configs.updateOne(
  { "configs.type": "Warehouse" },
  {
    $push: {
      "configs.$.actions": {
        id: "myaction",
        label: "My Action",
        engineAction: "MyNewAction",  // ← Must match rule.action
        roles: ["Admin"]
      }
    }
  }
)
```

**Step 3: No code changes needed** ✅

---

### Example: Attach Action Flow

**1. Config defines UI action**
```javascript
{
  id: "attach",
  label: "Attach",
  engineAction: "Attach",   // ← Links to rule
  roles: ["Admin", "Manager"]
}
```

**2. User clicks button → API call**
```typescript
await $fetch('/api/emc/lifecycle-action', {
  body: {
    entityId: 'ware-001',
    action: 'Attach',
    parentId: 'ware-root'
  }
})
```

**3. Engine loads rule and validates**
```typescript
const rule = lifecycleRules.findOne({
  action: 'Attach',
  entityType: 'Warehouse'
})

// rule.allowedRoles includes user role? ✓
// preConditions: lifecycle in ["READY", "ACTIVE"]? ✓
// crossEntityConditions: parent.lifecycle in ["READY", "ACTIVE"]? ✓
```

**4. Engine applies updates**
```typescript
emcCollection.updateOne(
  { _id: entity._id },
  {
    $set: {
      lifecycle: 'ACTIVE',
      assignment: 'LINKED'
    }
  }
)

emcCollection.updateOne(
  { _id: parent._id },
  {
    $set: {
      lifecycle: 'ACTIVE'
    }
  }
)
```

**5. Engine creates audit record**
```javascript
lifecycleAudit.insertOne({
  entityId: entity._id,
  action: 'Attach',
  previousState: {lifecycle: 'READY', assignment: 'NONE', ...},
  newState: {lifecycle: 'ACTIVE', assignment: 'LINKED', ...},
  cascadeInfo: {cascaded: false, affectedCount: 2},
  transactionId: '...'
})
```

**6. Client receives response**
```json
{
  "success": true,
  "data": {
    "action": "Attach",
    "entityId": "ware-001",
    "previousState": {...},
    "newState": {...},
    "changedDimensions": ["lifecycle", "assignment"],
    "cascade": {"cascaded": false, "affectedCount": 2},
    "auditId": "ObjectId"
  }
}
```

---

## 📊 Database Indexes

**Critical indexes for performance:**

```javascript
// lifecycleStates
db.lifecycleStates.createIndex({ entityType: 1, dimension: 1, code: 1, isActive: 1 })

// lifecycleRules
db.lifecycleRules.createIndex({ action: 1, entityType: 1, isActive: 1 })
db.lifecycleRules.createIndex({ priority: -1 })

// lifecycleAudit
db.lifecycleAudit.createIndex({ entityId: 1, action: 1 })
db.lifecycleAudit.createIndex({ executedAt: -1 })
db.lifecycleAudit.createIndex({ transactionId: 1 })

// emcCollection
db.emcCollection.createIndex({ organizationId: 1, lifecycle: 1 })
db.emcCollection.createIndex({ organizationId: 1, parentId: 1 })
db.emcCollection.createIndex({ organizationId: 1, id: 1 })
```

---

## 🧪 Testing Matrix

| Test Type | Coverage | Expected Result |
|-----------|----------|-----------------|
| Unit | Engine functions in isolation | All pass, no external dependencies |
| Integration | Engine + DB + API layer | Actions produce correct state changes |
| Cascade | Multi-level hierarchy trees | All descendants updated correctly |
| Role Based | Different user roles | Access control enforced |
| Override | Admin override mode | Bypasses validations correctly |
| Performance | Load test 100 concurrent | p99 latency < 500ms |
| Data | State consistency checks | No orphaned entities |
| Audit | Trail completeness | All actions logged |

---

## 📈 Performance Targets

| Operation | Target Latency | Notes |
|-----------|-----------------|-------|
| Single action (no cascade) | < 100ms | Entity update + audit |
| With cascade (10 children) | < 500ms | Includes recursive updates |
| With cascade (100+ children) | < 1s | May need optimization |
| Validation only (dryRun) | < 50ms | No DB writes |
| Audit trail query | < 200ms | Single entity history |

---

## 🔐 Security Controls

### Role-Based Access
```javascript
rule.allowedRoles = ["Admin", "Manager"]
// Only these roles can execute this action
```

### Override Mode
```typescript
override: true  // Admin only - bypasses all validations
overrideReason: "Emergency attachment"  // Audit logged
```

### Data Isolation
```javascript
organizationId: 12313
// All operations filtered by organization
```

### Audit Trail
```javascript
// Every action logged with:
// - Who did it (userId, userName, role)
// - When (timestamp)
// - What changed (previousState, newState)
// - Why (reason field)
```

---

## 🚀 Deployment Checklist

- [ ] All 3 code files created and tested
- [ ] All 4 documentation files generated
- [ ] Database backup created
- [ ] Collections created (lifecycleStates, lifecycleRules, lifecycleAudit)
- [ ] Seed data inserted
- [ ] emcCollection extended with 6 dimensions
- [ ] Config collection updated with engineAction
- [ ] API endpoint tested
- [ ] Load test passed (p99 < 500ms)
- [ ] Audit trail verified
- [ ] Rollback procedure tested
- [ ] Documentation distributed to team
- [ ] Team training completed
- [ ] Feature flag ready (if using)
- [ ] Monitoring alerts configured
- [ ] Stakeholder sign-off obtained

---

## 📞 Support

### Implementation Questions
- Refer to: LIFECYCLE_ENGINE_SPECIFICATION_V2.md

### Migration Questions
- Refer to: LIFECYCLE_ENGINE_MIGRATION_GUIDE.md

### Current System
- Refer to: MILESTONE_LIFECYCLE_CURRENT_STATUS.md

### Code Reference
- Main: `server/utils/emcLifeCycleEngine.ts` (500 lines)
- API: `server/api/emc/lifecycle-action.post.ts` (150 lines)
- Seed: `server/seeds/seed-lifecycle-engine.ts` (350 lines)

---

**Status:** ✅ READY FOR DEPLOYMENT  
**All Logic:** Single File Architecture  
**Complexity:** Medium (well-documented)  
**Risk:** Low (comprehensive migration guide)  
**Timeline:** 1-2 weeks (3-phase rollout)

Generated: February 22, 2026  
Version: 2.0 System-Integrated
