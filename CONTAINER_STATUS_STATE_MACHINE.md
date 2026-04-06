# Container Status State Machine - Developer Guide

**Version:** 2.0  
**Date:** February 22, 2026  
**Status:** Enhanced with multi-status awareness  

---

## **Overview**

The `containerStatusManager.ts` now includes a comprehensive state machine that:

✅ Defines all valid status transitions  
✅ Enforces state rules at the system level  
✅ Provides state validation before action execution  
✅ Manages cascade effects across multiple containers  
✅ Maintains complete audit trails  

---

## **1. Status State Machine Definition**

### **Valid Transitions**

```typescript
DRAFT
  ├─ Activate  → READY
  └─ Archive   → ARCHIVED

READY
  ├─ Attach    → ACTIVE
  └─ Archive   → ARCHIVED

ACTIVE
  ├─ Detach    → READY or ACTIVE (depends on remaining children)
  ├─ Close     → CLOSED
  └─ Archive   → ARCHIVED

CLOSED
  ├─ Reopen    → READY
  └─ Archive   → ARCHIVED

ARCHIVED (Terminal State)
  └─ (No transitions allowed)
```

### **Visual Diagram**

```
┌──────────┐
│  DRAFT   │  ← Initial state
└────┬─────┘
     │ Activate
     ▼
┌──────────┐
│  READY   │  ← Waiting for action
└────┬─────┘
     │ Attach
     ▼
┌──────────┐
│  ACTIVE  │  ← In use
└────┬─────┘
     │ Close or Detach
     ▼
┌──────────┐
│  CLOSED  │  ← Completed
└────┬─────┘
     │ Reopen
     └─────────────┐
                   │
              ┌────▼─┐
              │READY │
              └──────┘

At ANY point: Archive → ARCHIVED (Terminal)
```

---

## **2. Using the State Machine**

### **Import Required Functions**

```typescript
import {
  getValidActionsForStatus,
  isValidTransition,
  getNewStatus,
  preflightCheckAction,
  updateContainerStatus,
  STATUS_TRANSITIONS,
  type ContainerStatus,
  type ValidActionInfo,
} from '~/server/utils/containerStatusManager'
```

---

## **3. Query Valid Actions for a Status**

### **Get All Valid Actions**

Get what actions can be performed on a container with a given status:

```typescript
// User is viewing a DRAFT container
const containerStatus = 'DRAFT'
const validActions = getValidActionsForStatus(containerStatus)

// Returns:
[
  {
    action: 'Activate',
    currentStatus: 'DRAFT',
    newStatus: 'READY',
    requiresChild: false,
    causesChildCascade: false,
    description: 'Prepare container for use'
  },
  {
    action: 'Archive',
    currentStatus: 'DRAFT',
    newStatus: 'ARCHIVED',
    requiresChild: false,
    causesChildCascade: false,
    description: 'Archive container and all descendants'
  }
]
```

### **Use Case: Dynamic UI Buttons**

```typescript
// In your Vue component
export default {
  data() {
    return {
      container: { id: 'WAR-001', lifecycle: 'DRAFT' }
    }
  },
  computed: {
    availableActions() {
      return getValidActionsForStatus(this.container.lifecycle)
    }
  }
}

// Template
<div v-for="action in availableActions" :key="action.action">
  <button 
    :disabled="action.requiresChild && !selectedChild"
    @click="executeAction(action.action)"
  >
    {{ action.action }}
  </button>
</div>
```

---

## **4. Check If Transition is Valid**

### **Validate Action Before Execution**

```typescript
const currentStatus = container.lifecycle // 'DRAFT'
const action = 'Activate' // User wants to activate

if (isValidTransition(currentStatus, action)) {
  // Safe to execute
  await updateContainerStatus(containerId, action, userContext)
} else {
  // Not allowed
  console.error(`Cannot perform ${action} on ${currentStatus} container`)
}
```

### **Get Expected New Status**

```typescript
const currentStatus = 'READY'
const action = 'Attach'

const newStatus = getNewStatus(currentStatus, action)
// Returns: 'ACTIVE'

// Use for UI preview
<p>After attaching: {{ newStatus }}</p>
```

---

## **5. Preflight Validation**

### **Pre-Check Before Action**

Validate action requirements and cascade effects BEFORE execution:

```typescript
const container = await emcContainers.findOne({ id: 'WAR-001' })
const action = 'Close'
const parentId = 'WAR-001'
const childId = undefined // Not needed for Close

const preflight = await preflightCheckAction(
  container,
  action,
  parentId,
  childId
)

if (preflight.valid) {
  console.log('✅ Action is safe to execute')
  // Proceed with updateContainerStatus
} else {
  console.error('❌ Validation errors:', preflight.errors)
  // Display errors to user
  preflight.errors.forEach(err => {
    showErrorToast(err)
  })
}
```

### **What Gets Validated**

1. ✅ Status transition is allowed
2. ✅ Required parameters are provided (parent, child)
3. ✅ Parent/child containers exist
4. ✅ Parent has correct status for action
5. ✅ Cascade effects are detected and logged

### **Example: Preflight for Attach**

```typescript
const preflight = await preflightCheckAction(
  asyncContainer,  // Must be READY or ACTIVE
  'Attach',
  'WAR-001',       // Parent ID (required)
  'ULD-002'        // Child ID (required)
)

// Validation checks:
// 1. Is Attach valid for current status? ✓
// 2. Parent ID provided? ✓
// 3. Child ID provided? ✓
// 4. Parent WAR-001 exists? ✓
// 5. Parent is READY or ACTIVE? ✓
// 6. Child ULD-002 exists? ✓
```

---

## **6. Execute Status Transitions**

### **Basic Usage**

```typescript
const result = await updateContainerStatus(
  containerId,       // 'WAR-001'
  action,            // 'Activate'
  userContext,       // { id, name, code }
  parentContainerId, // Optional: 'WAR-001'
  childContainerId   // Optional: 'ULD-002'
)

if (result.success) {
  console.log(result.message)
  // ✓ Warehouse-001 activated and ready for use.
  
  console.log(result.updatedContainers)
  // [{ id: 'WAR-001', previousStatus: 'DRAFT', newStatus: 'READY' }]
} else {
  console.error('Action failed:', result.message)
}
```

### **With Preflight Check (Recommended)**

```typescript
// Get container
const container = await emcContainers.findOne({ id: containerId })

// Preflight validation
const preflight = await preflightCheckAction(
  container,
  action,
  parentId,
  childId
)

if (!preflight.valid) {
  return {
    success: false,
    message: `Validation failed: ${preflight.errors.join('; ')}`
  }
}

// Execute action
const result = await updateContainerStatus(
  containerId,
  action,
  userContext,
  parentId,
  childId
)

return result
```

---

## **7. Understanding Cascade Effects**

### **Actions That Cascade**

```
Close:    Container ACTIVE → CLOSED
          All ACTIVE children → CLOSED
          
Archive:  Container (any) → ARCHIVED
          All descendants → ARCHIVED (recursive)
```

### **Preflight Cascade Check**

```typescript
const container = await emcContainers.findOne({ id: 'WAR-001' })

// Check if action has cascade effects
const preflight = await preflightCheckAction(container, 'Close')

// Logs:
// ⚠️  Action "Close" will cascade to 3 children with statuses: ACTIVE, READY

// In your code:
if (preflight.valid) {
  const result = await updateContainerStatus(containerId, 'Close', userContext)
  
  console.log(result.updatedContainers)
  // [
  //   { id: 'WAR-001', previousStatus: 'ACTIVE', newStatus: 'CLOSED' },
  //   { id: 'ULD-001', previousStatus: 'ACTIVE', newStatus: 'CLOSED' },
  //   { id: 'ULD-002', previousStatus: 'ACTIVE', newStatus: 'CLOSED' }
  // ]
}
```

### **Example: Close with Confirmation Dialog**

```typescript
// Before showing dialog
const preflight = await preflightCheckAction(container, 'Close')

if (preflight.valid) {
  const childAssocs = await ContainerAssociation.find({
    parentContainerId: container.id,
    status: 'active'
  })
  const childIds = childAssocs.flatMap(a => a.childContainerIds || [])
  const affectedCount = childIds.length
  
  // Show dialog
  showConfirmationDialog({
    title: 'Close Container?',
    message: `This will affect ${affectedCount} container(s)`,
    affectedContainers: childIds,
    onConfirm: () => {
      updateContainerStatus(containerId, 'Close', userContext)
    }
  })
}
```

---

## **8. Multi-Status Awareness**

### **Example: Managing Complex Workflows**

```typescript
// Scenario: User wants to detach a child from a parent
// Need to know: Parent's new status depends on remaining children

async function detachChild(parentId, childId) {
  const parent = await emcContainers.findOne({ id: parentId })
  
  // Check if valid
  if (!isValidTransition(parent.lifecycle, 'Detach')) {
    return { success: false, message: 'Parent cannot detach in current status' }
  }
  
  // Preflight check
  const preflight = await preflightCheckAction(
    parent,
    'Detach',
    parentId,
    childId
  )
  
  if (!preflight.valid) {
    return { success: false, message: preflight.errors.join('; ') }
  }
  
  // Execute
  const result = await updateContainerStatus(
    parentId,
    'Detach',
    userContext,
    parentId,
    childId
  )
  
  // Result tells us if parent changed status
  const parentStatusChanged = result.updatedContainers[0]
  if (parentStatusChanged.newStatus === 'READY') {
    showNotification('Last child detached. Parent moved to READY')
  }
  
  return result
}
```

---

## **9. API Endpoint Integration**

### **Updated Endpoint Example**

```typescript
// server/api/container/action.post.ts

export default defineEventHandler(async (event) => {
  const { containerId, action, parentId, childId, reason } = await readBody(event)

  try {
    // Load container
    const container = await emcContainers.findOne({ id: containerId })
    if (!container) {
      throw createError({ statusCode: 404, message: 'Container not found' })
    }

    // Get user context
    const session = await getServerSession(event)
    const userContext = {
      id: session.user.id,
      name: session.user.name,
      code: session.user.code
    }

    // Preflight validation
    const preflight = await preflightCheckAction(
      container,
      action,
      parentId,
      childId
    )

    if (!preflight.valid) {
      return {
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        errors: preflight.errors
      }
    }

    // Get available actions for UI
    const availableActions = getValidActionsForStatus(container.lifecycle)

    // Execute action
    const result = await updateContainerStatus(
      containerId,
      action,
      userContext,
      parentId,
      childId
    )

    return {
      ...result,
      availableActions: getValidActionsForStatus(
        result.updatedContainers?.[0]?.newStatus || container.lifecycle
      )
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: error.message
    })
  }
})
```

---

## **10. Frontend Implementation Pattern**

### **Component Lifecycle**

```typescript
export default {
  data() {
    return {
      container: null,
      validActions: [],
      executing: false,
      selectedChild: null
    }
  },

  async mounted() {
    await this.loadContainer()
  },

  methods: {
    async loadContainer() {
      this.container = await $fetch(`/api/container/${this.containerId}`)
      this.updateAvailableActions()
    },

    updateAvailableActions() {
      this.validActions = getValidActionsForStatus(this.container.lifecycle)
    },

    async executeAction(action) {
      this.executing = true

      try {
        // Check if child is required
        const actionInfo = this.validActions.find(a => a.action === action)
        if (actionInfo.requiresChild && !this.selectedChild) {
          this.showError('Please select a child container')
          return
        }

        // Show confirmation for destructive actions
        if (['Close', 'Archive'].includes(action)) {
          const confirmed = await this.showConfirmation(action)
          if (!confirmed) return
        }

        // Execute
        const result = await $fetch('/api/container/action', {
          method: 'POST',
          body: {
            containerId: this.container.id,
            action,
            parentId: this.containerId,
            childId: this.selectedChild?.id
          }
        })

        if (result.success) {
          this.showSuccess(result.message)
          this.container.lifecycle = result.updatedContainers[0].newStatus
          this.validActions = result.availableActions
        }
      } catch (error) {
        this.showError(error.message)
      } finally {
        this.executing = false
      }
    }
  }
}
```

---

## **11. Testing the State Machine**

### **Test Case: Status Transition Validation**

```typescript
describe('Container Status State Machine', () => {
  it('should allow valid transitions', () => {
    expect(isValidTransition('DRAFT', 'Activate')).toBe(true)
    expect(isValidTransition('READY', 'Attach')).toBe(true)
    expect(isValidTransition('ACTIVE', 'Close')).toBe(true)
  })

  it('should reject invalid transitions', () => {
    expect(isValidTransition('DRAFT', 'Close')).toBe(false)
    expect(isValidTransition('ARCHIVED', 'Activate')).toBe(false)
    expect(isValidTransition('CLOSED', 'Attach')).toBe(false)
  })

  it('should return correct new status', () => {
    expect(getNewStatus('DRAFT', 'Activate')).toBe('READY')
    expect(getNewStatus('READY', 'Attach')).toBe('ACTIVE')
    expect(getNewStatus('ACTIVE', 'Close')).toBe('CLOSED')
  })

  it('should validate preflight checks', async () => {
    const container = { id: 'WAR-001', lifecycle: 'DRAFT' }
    const preflight = await preflightCheckAction(container, 'Activate')
    
    expect(preflight.valid).toBe(true)
    expect(preflight.errors).toHaveLength(0)
  })

  it('should catch invalid preflight checks', async () => {
    const container = { id: 'WAR-001', lifecycle: 'CLOSED' }
    const preflight = await preflightCheckAction(container, 'Close')
    
    expect(preflight.valid).toBe(false)
    expect(preflight.errors.length).toBeGreaterThan(0)
  })
})
```

---

## **Key Benefits**

| Feature | Benefit |
|---------|---------|
| **State Machine** | Single source of truth for valid transitions |
| **Preflight Checks** | Prevent invalid operations before DB write |
| **Cascade Detection** | Show users impact before confirmation |
| **Multi-Status Awareness** | Smart status determination (Detach returns READY or ACTIVE) |
| **API Clarity** | Frontend knows exactly what's possible at each status |
| **Type Safety** | TypeScript enforces status types |
| **Audit Trail** | Every transition recorded with who, when, why |

---

## **Migration Checklist**

- ✅ Update imports to use new functions
- ✅ Add preflight validation to API endpoints
- ✅ Use `getValidActionsForStatus` for UI button rendering
- ✅ Show cascade confirmation for Close/Archive
- ✅ Display available actions based on status
- ✅ Update error messages to reference validation errors
- ✅ Test state transitions in all scenarios
- ✅ Monitor logs for preflight warnings

---

This state machine approach ensures that no invalid status transitions can occur, the UI always shows correct actions, and users are fully informed of cascade effects.
