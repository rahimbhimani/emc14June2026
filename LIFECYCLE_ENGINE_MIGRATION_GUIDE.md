# Lifecycle Engine Migration Guide

**Version:** 2.0  
**Date:** February 22, 2026  
**Status:** READY FOR IMPLEMENTATION  
**Target Migration Date:** [To be scheduled]

---

## 📋 Overview

This guide provides step-by-step instructions for migrating from the current single-dimensional lifecycle system to the new generic multi-dimensional lifecycle engine.

**Key Benefits:**
- Single file architecture (500 lines vs 6 files, 1000+ lines)
- Metadata-driven rules (no hardcoding)
- 6 concurrent state dimensions per entity
- Role-based action control
- Complete audit trail
- Override support for admins
- Simpler testing and deployment

**Migration Timeline:** 3-phase gradual rollout (1-2 weeks)

---

## 🔍 Pre-Migration Checklist

### Environment Setup
- [ ] MongoDB 4.4+ with transaction support enabled
- [ ] Node.js 18+
- [ ] Nuxt 3 development environment running
- [ ] All tests passing in current system
- [ ] No active container modifications in production

### Code Readiness
- [ ] emcLifeCycleEngine.ts created in `server/utils/`
- [ ] lifecycle-action.post.ts endpoint created in `server/api/emc/`
- [ ] seed-lifecycle-engine.ts created in `server/seeds/`
- [ ] All TypeScript types defined
- [ ] All database collections created (see step 1)

### Data Readiness
- [ ] Full database backup created
- [ ] Backup location documented
- [ ] Container count verified: `db.emcCollection.countDocuments()`
- [ ] Movement count verified: `db.ContainerMovement.countDocuments()`
- [ ] Config collection verified

### Approval
- [ ] Stakeholders reviewed migration plan
- [ ] Maintenance window scheduled
- [ ] Rollback procedures tested
- [ ] User communication prepared

---

## 🚀 Phase 1: Foundation (Days 1-2)

### Step 1.1: Create Database Collections

**Objective:** Set up new collections without affecting existing data

```bash
# Option 1: Run seed script (recommended)
npm run seed:lifecycle

# Option 2: Manual MongoDB commands
```

**Commands:**
```javascript
// Create lifecycleStates
db.createCollection('lifecycleStates')
db.lifecycleStates.createIndex({ entityType: 1, dimension: 1, code: 1, isActive: 1 })

// Create lifecycleRules
db.createCollection('lifecycleRules')
db.lifecycleRules.createIndex({ action: 1, entityType: 1, isActive: 1 })
db.lifecycleRules.createIndex({ priority: -1 })

// Create lifecycleAudit
db.createCollection('lifecycleAudit')
db.lifecycleAudit.createIndex({ entityId: 1, action: 1 })
db.lifecycleAudit.createIndex({ executedAt: -1 })
db.lifecycleAudit.createIndex({ transactionId: 1 })
```

**Verification:**
```javascript
// Verify collections exist
db.getCollectionNames().includes('lifecycleStates')  // true
db.getCollectionNames().includes('lifecycleRules')   // true
db.getCollectionNames().includes('lifecycleAudit')   // true

// Verify seeds loaded
db.lifecycleStates.countDocuments()    // 42
db.lifecycleRules.countDocuments()     // 6
```

### Step 1.2: Extend emcCollection Schema

**Objective:** Add 6 new state dimensions to existing containers

```javascript
// Backup current data (optional, but recommended)
db.emcCollection.find().pretty() > emcCollection_backup.json

// Add new fields to all documents
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
      currentStateVersion: 1
    },
    $setOnInsert: {
      stateHistory: []
    }
  }
)

// Verify
db.emcCollection.findOne() // Should have all new fields
```

**Preserve Existing Lifecycle:**
```javascript
// If containers already have lifecycle values, preserve them
db.emcCollection.updateMany(
  { lifecycle: { $exists: true } },
  {
    $set: {
      // Keep existing lifecycle value
      // Add defaults for new dimensions
      assignment: "NONE",
      inventory: "NA",
      location: "NA",
      control: "NA",
      operation: "NA"
    }
  }
)
```

### Step 1.3: Update Config Collection

**Objective:** Map action.id to engineAction field

```javascript
// Add engineAction mappings to all config actions
db.configs.updateMany(
  {},
  [
    {
      $set: {
        configs: {
          $map: {
            input: "$configs",
            as: "config",
            in: {
              ...$$config,
              actions: {
                $map: {
                  input: "$$config.actions",
                  as: "action",
                  in: {
                    ...$$action,
                    engineAction: {
                      $switch: {
                        branches: [
                          { case: { $eq: ["$$action.id", "activate"] }, then: "Activate" },
                          { case: { $eq: ["$$action.id", "attach"] }, then: "Attach" },
                          { case: { $eq: ["$$action.id", "detach"] }, then: "Detach" },
                          { case: { $eq: ["$$action.id", "close"] }, then: "Close" },
                          { case: { $eq: ["$$action.id", "reopen"] }, then: "Reopen" },
                          { case: { $eq: ["$$action.id", "archive"] }, then: "Archive" }
                        ],
                        default: "$$action.id"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  ]
)

// Verify
db.configs.findOne().configs[0].actions[0].engineAction // "Attach", "Detach", etc.
```

### Step 1.4: Deploy Engine Code

**Objective:** Deploy new files without using them yet

```bash
# Copy files to production
cp emcLifeCycleEngine.ts → server/utils/
cp lifecycle-action.post.ts → server/api/emc/
cp seed-lifecycle-engine.ts → server/seeds/

# Update imports in any dependent files
# NO CHANGES to existing code yet

# Restart application (in development)
npm run dev

# Verify no errors
# Check server logs for startup issues
```

**Verification:**
```typescript
// In Nuxt API context, verify import works
import { executeLifecycleAction } from '~/server/utils/emcLifeCycleEngine'

const result = executeLifecycleAction({...})
// Should compile without errors
```

---

## 🔄 Phase 2: Dual-Write Testing (Days 3-4)

### Step 2.1: Create Compatibility Layer

**Objective:** Keep old handlers working while new engine validates in background

```typescript
// File: server/api/emc/container-validate-engine.post.ts
// New endpoint that validates actions against new engine WITHOUT committing

export default defineEventHandler(async (event) => {
  const body = await readBody(event) // Same format as lifestyle-action
  
  const result = await executeLifecycleAction({
    ...body,
    dryRun: true  // ← Only validates, doesn't update
  })
  
  return {
    engineValidation: result,
    timestamp: new Date()
  }
})
```

### Step 2.2: Run Validation Tests

**Objective:** Ensure new engine validates same as old system

```bash
# Run test suite against new engine
npm run test:lifecycle-engine

# Sample tests:
# ✓ Attach action validates same as old system
# ✓ Detach calculates correct parent status
# ✓ Close cascades correctly to children
# ✓ Archive recursively updates descendants
# ✓ Role validation works
# ✓ Override bypasses validations for admin
```

### Step 2.3: Load Testing

**Objective:** Verify performance meets SLA

```bash
# Load test: 100 concurrent lifecycle actions
npm run load-test:lifecycle

# Expected results:
# - 99th percentile latency: < 500ms
# - Single action: < 100ms (in isolation)
# - Cascade action (100 children): < 1s
# - Error rate: 0%
```

### Step 2.4: Audit Trail Comparison

**Objective:** Verify new audit format matches old

```javascript
// Old system
db.ContainerMovement.findOne() 
// {organizationId, movementType, parentContainerId, fromStatus, toStatus, movedBy, ...}

// New system
db.lifecycleAudit.findOne()
// {organizationId, action, entityId, previousState, newState, performedBy, ...}

// Comparison report
db.ContainerMovement.countDocuments()
// Should match db.lifecycleAudit.countDocuments() after migration
```

---

## 🎯 Phase 3: Switchover (Day 5)

### Step 3.1: Enable New Engine Endpoint

**Objective:** Make new endpoint available (old handlers still active)

```typescript
// File: pages/emc/emcContainer.vue or component calling actions
// Update action handlers to use new endpoint

// OLD:
const response = await $fetch('/api/emc/container-attach', ...)

// NEW:
const response = await $fetch('/api/emc/lifecycle-action', {
  method: 'POST',
  body: {
    entityId: container.id,
    action: 'Attach',  // ← Now maps to lifecycleRules.action
    parentId: parent.id,
    reason: 'User requested attachment'
  }
})
```

**Gradual Rollout Option 1: Feature Flag**
```typescript
// Use feature flag to control rollout
const useNewEngine = computed(() => {
  return configStore.featureFlags?.useNewLifecycleEngine || false
})

const handleAction = async () => {
  if (useNewEngine.value) {
    return await $fetch('/api/emc/lifecycle-action', ...)
  } else {
    return await $fetch('/api/emc/container-attach', ...)
  }
}
```

**Gradual Rollout Option 2: User/Org Based**
```typescript
// By organization
if (user.organizationId === 12313) {
  // Use new engine (pilot org)
  return await $fetch('/api/emc/lifecycle-action', ...)
} else {
  // Use old engine
  return await $fetch('/api/emc/container-attach', ...)
}

// Later: expand to more orgs
```

### Step 3.2: Monitor Metrics

**Objective:** Watch system health during switchover

**Key Metrics:**
```javascript
// Success rate
db.lifecycleAudit.countDocuments({ success: true }) / totalActions * 100
// Should be > 99%

// Action latencies
db.lifecycleAudit.aggregate([
  { $group: {
    _id: "$action",
    avgDuration: { $avg: { $subtract: ["$executedAt", "$requestedAt"] } },
    p99Duration: { $percentile: [{ $subtract: ["$executedAt", "$requestedAt"] }, [0.99]] }
  }}
])

// Error codes
db.lifecycleAudit.countDocuments({ success: false })
db.lifecycleAudit.aggregate([
  { $match: { success: false } },
  { $group: { _id: "$errorCode", count: { $sum: 1 } } }
])

// Cascade statistics
db.lifecycleAudit.aggregate([
  { $group: {
    _id: "$action",
    cascadeCount: { $sum: { $cond: ["$cascadeInfo.cascaded", 1, 0] } },
    avgAffected: { $avg: "$cascadeInfo.affectedCount" }
  }}
])
```

**Dashboard Setup:**
```bash
# Add to monitoring dashboard
# - Lifecycle action success rate (should be > 99%)
# - Action latency (should be < 500ms p99)
# - Cascade performance (should be < 1s for 100+ descendants)
# - Override usage (should be < 1% of actions)
# - Error rate by type
```

### Step 3.3: Validation Checks

**Objective:** Ensure data consistency during switchover

```javascript
// Check 1: All containers have new dimensions
db.emcCollection.countDocuments({
  lifecycle: { $exists: true },
  assignment: { $exists: true },
  inventory: { $exists: true },
  location: { $exists: true },
  control: { $exists: true },
  operation: { $exists: true }
}) === db.emcCollection.countDocuments()

// Check 2: All actions have rules
const unhandledActions = db.configs.aggregate([
  { $unwind: "$configs" },
  { $unwind: "$configs.actions" },
  { $match: { "configs.actions.engineAction": { $exists: false } } },
  { $count: "documents" }
])
// Should return 0

// Check 3: Audit trail growing
db.lifecycleAudit.countDocuments() > 0

// Check 4: No old-system entries mixed in
// (If migrating audit trail)
db.lifecycleAudit.countDocuments({ movementType: { $exists: true } })
// Should be 0 (no old format)
```

---

## ↩️ Rollback Procedures

### Scenario 1: Full Rollback (If Issues Detected)

**Timeline:** < 5 minutes

```bash
# STEP 1: Stop using new engine immediately
# - Disable feature flag
# - Revert config changes using git
# - Restart application

git checkout server/api/emc/emcContainer.vue
npm run dev

# STEP 2: Restore database snapshot
mongorestore --archive=backup_pre_migration.archive --nsInclude='*'

# STEP 3: Verify old system operational
# - Test attach action
# - Test detach action
# - Verify audit trail (ContainerMovement)

# STEP 4: Investigate issue
# - Check logs
# - Review errors
# - Plan corrective action
```

### Scenario 2: Partial Rollback (By Organization)

**Timeline:** < 2 minutes

```javascript
// Disable for one org only
const useNewEngine = (organizationId) => {
  const disabledOrgs = [12313] // Temporarily disabled
  return !disabledOrgs.includes(organizationId)
}

// Other orgs continue with new engine
// Affected org reverts to old handlers
```

### Scenario 3: Data Fix (Consistency Issues)

**Timeline:** < 10 minutes

```javascript
// Issue: Some containers have incorrect state
// Fix: Batch update using engine rules validation

db.emcCollection.updateMany(
  { lifecycle: "INVALID_STATE" },
  {
    $set: {
      lifecycle: "READY",  // Corrected state
      updatedAt: new Date(),
      correctedAt: new Date()
    }
  }
)

// Document fix in lifecycleAudit
db.lifecycleAudit.insertOne({
  action: "SYSTEM_CORRECTION",
  reason: "Consistency fix",
  affectedCount: 5,
  timestamp: new Date()
})
```

---

## ✅ Post-Migration Checklist

### Week 1 (Stabilization)
- [ ] Monitor system 24/7
- [ ] Response time SLA maintained (< 500ms)
- [ ] Success rate > 99%
- [ ] Zero data corruption
- [ ] Users report no issues
- [ ] Audit trail complete and accurate
- [ ] Cascades working correctly

### Week 2 (Cleanup)
- [ ] All actions moved to new engine
- [ ] Feature flag removed (new engine always used)
- [ ] Old API endpoints deprecated (still available but not used)
- [ ] Documentation updated
- [ ] Team trained on new system

### Week 3 (Archive)
- [ ] Old handler files marked for deletion
- [ ] Dependencies moved to new engine
- [ ] Backup archive stored securely
- [ ] Migration report generated
- [ ] Lessons learned documented

### Week 4+ (Optimization)
- [ ] Performance tuning based on metrics
- [ ] Advanced features implemented (if needed)
- [ ] Custom rules added per org (if needed)
- [ ] Continuation plan for future enhancements

---

## 📊 Comparison: Old vs New System

| Aspect | Old System | New System |
|--------|-----------|-----------|
| **Architecture** | 6 distributed handlers | Single engine file |
| **Rules Storage** | Hardcoded in handlers | MongoDB (lifecycleRules) |
| **Code Duplication** | High (across 6 files) | None |
| **State Dimensions** | 1 (lifecycle only) | 6 (concurrent) |
| **Role Control** | Fixed per handler | Flexible in rules |
| **Audit Trail** | ContainerMovement collection | lifecycleAudit collection |
| **Override Support** | Limited | Full admin support |
| **Testing** | Multiple handler tests | Single engine tests |
| **Maintenance** | Update 6 files | Edit rules in DB |
| **Lines of Code** | 1000+ | ~500 |
| **Configuration** | UI config only | UI config + rules config |

---

## 🎓 Training Materials

### For Developers
- Architecture overview (see LIFECYCLE_ENGINE_SPECIFICATION_V2.md)
- Code walkthrough of emcLifeCycleEngine.ts
- How to add new rules
- Testing strategy

### For DBAs
- New collections structure
- Index requirements
- Backup/restore procedures
- Performance monitoring

### For Users
- No change in UI functionality
- Same actions available
- Faster responses (potentially)
- Better audit trail

---

## 📞 Support Plan

### During Migration
- Dedicated support person monitoring
- Escalation path for critical issues
- 24/7 on-call engineer
- Incident response playbook

### Post-Migration
- Weekly health checks for 1 month
- Monthly performance reviews
- Quarterly rule optimization
- Annual system audit

---

## ✨ Success Criteria

Migration is successful if:

1. **Functionality** ✅
   - All 6 lifecycle actions work identically
   - Multi-select operations succeed
   - Cascading updates complete correctly
   - Role-based access enforced

2. **Performance** ✅
   - Single action: < 100ms average
   - Cascaded action: < 1s for 100 descendants
   - 99th percentile: < 500ms
   - Zero timeout errors

3. **Reliability** ✅
   - Success rate > 99.9%
   - Zero data corruption
   - Complete audit trail
   - Transactions committed atomically

4. **Compatibility** ✅
   - No breaking changes to API
   - Client code requires only minor updates
   - Existing data preserved and accessible
   - Rollback possible if needed

5. **Operations** ✅
   - Monitoring in place
   - Alerting configured
   - Documentation complete
   - Team trained

---

## 📈 Future Enhancements

After successful migration:

1. **Custom Rules Per Organization**
   - Each org defines own transitions
   - UI to manage lifecycleRules

2. **Advanced Features**
   - Conditional state updates (if-then logic)
   - Multi-step workflows
   - Approval workflows

3. **Performance Optimizations**
   - Caching of rules
   - Batch operations
   - Async cascade processing

4. **Extended Audit**
   - State change history visualization
   - Audit trail API
   - Compliance reporting

---

**Status:** READY FOR DEPLOYMENT  
**Next Step:** Schedule migration with stakeholders  
**Questions:** Contact development team  

Generated: February 22, 2026  
Document Version: 1.0
