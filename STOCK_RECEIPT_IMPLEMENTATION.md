# Stock Receipt (Warehouse Goods Inward) - Implementation Guide

## Overview

The StockReceipt feature enables users to receive stock into a warehouse with mandatory inventory audit trail using MongoDB transactions.

## Files Created

### Models
- **[containerInventory.ts](./server/models/containerInventory.ts)** - Container inventory tracking per item
- **[emcInventoryMovements.ts](./server/models/emcInventoryMovements.ts)** - Inventory movement audit trail
- **[emcInvItem.ts](./server/models/emcInvItem.ts)** - Product master data

### Services
- **[stockReceiptService.ts](./server/utils/stockReceiptService.ts)** - Core business logic
  - Warehouse validation
  - Product validation (lifecycle = ACTIVE)
  - Quantity validation
  - MongoDB transaction handling
  - Inventory update/insert
  - Movement record creation

### Utilities
- **[setupInventoryIndexes.ts](./server/utils/setupInventoryIndexes.ts)** - Index initialization

### API Endpoints
- **[stock-receipt.post.ts](./server/api/emc/inventory/stock-receipt.post.ts)** - POST `/api/emc/inventory/stock-receipt`
- **[setup.get.ts](./server/api/emc/inventory/setup.get.ts)** - GET `/api/emc/inventory/setup`

## Database Schema

### containerInventory
```javascript
{
  _id: ObjectId,
  organizationId: number,
  containerId: string,
  containerType: "Warehouse" | "Trolley",
  itemId: ObjectId | string,
  quantityOnHand: number,
  quantityReserved: number,
  quantityAvailable: number,  // = quantityOnHand - quantityReserved
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- Unique compound: `{ organizationId: 1, containerId: 1, itemId: 1 }`

### emcInventoryMovements
```javascript
{
  _id: ObjectId,
  organizationId: number,
  movementType: "StockReceipt" | "StockIssue" | "Transfer",
  containerId: string,
  containerType: string,
  itemId: ObjectId | string,
  quantity: number,
  reference?: string,           // e.g., PO-001
  remarks?: string,             // e.g., "Initial stock"
  performedBy: string,
  performedAt: Date,
  createdAt: Date
}
```

**Indexes:**
- `{ organizationId: 1, containerId: 1 }`
- `{ organizationId: 1, itemId: 1 }`
- `{ performedAt: -1 }`

## API Reference

### 1. Initialize Indexes
**Endpoint:** `GET /api/emc/inventory/setup`

Run once after deployment to create required MongoDB indexes.

**Response:**
```json
{
  "success": true,
  "message": "Inventory system setup completed successfully",
  "timestamp": "2026-02-23T10:30:45.123Z"
}
```

### 2. Stock Receipt
**Endpoint:** `POST /api/emc/inventory/stock-receipt`

Receives stock into warehouse.

**Request Body:**
```json
{
  "organizationId": 12313,
  "warehouseId": "WH001",
  "itemId": "507f1f77bcf86cd799439011",
  "quantity": 200,
  "reference": "PO-0001",
  "remarks": "Initial stock",
  "performedBy": "USER001"
}
```

**Required Fields:**
- `organizationId` (number) - Organization ID
- `warehouseId` (string) - Warehouse container ID
- `itemId` (string) - Product ID (ObjectId)
- `quantity` (number) - Quantity to receive (must be positive integer)
- `performedBy` (string) - User performing the action

**Optional Fields:**
- `reference` (string) - Reference number (e.g., PO, GRN)
- `remarks` (string) - Notes about the receipt

**Success Response (HTTP 200):**
```json
{
  "success": true,
  "message": "StockReceipt completed successfully",
  "data": {
    "movementId": "507f1f77bcf86cd799439012",
    "inventoryId": "507f1f77bcf86cd799439013",
    "previousQuantity": 100,
    "newQuantity": 300
  }
}
```

**Error Response (HTTP 200):**
```json
{
  "success": false,
  "message": "StockReceipt operation failed",
  "error": "Warehouse not found: WH001"
}
```

## Business Validation Rules

### Rule 1: Warehouse Validation
- Warehouse container must exist in `emcContainers`
- `type` must be "Warehouse"
- `organizationId` must match
- `lifecycle` must NOT be "ARCHIVED"

**Error:** `Warehouse not found: {warehouseId}` or `Warehouse is archived and cannot receive stock`

### Rule 2: Product Validation
- Product must exist in `emcInvItem`
- `_id` must match `itemId`
- `organizationId` must match
- `lifecycle` must be exactly "ACTIVE"

**Error:** `Product not found: {itemId}` or `Product is not ACTIVE (current: {lifecycle})`

### Rule 3: Quantity Validation
- Must be numeric (not string)
- Must be positive (> 0)
- Must be integer (no decimals)

**Error:** `Quantity must be greater than 0` or `Quantity must be numeric`

## Transaction Logic

All StockReceipt operations execute within a MongoDB transaction to ensure data consistency:

### Step 1: Find Container Inventory
Query `containerInventory` using:
- `organizationId`
- `containerId` = `warehouseId`
- `itemId`

### Step 2: Update or Insert
**If record exists:**
- Update `quantityOnHand += quantity`
- Recalculate `quantityAvailable = quantityOnHand - quantityReserved`
- Update `updatedAt = now`

**If record does NOT exist:**
- Insert new record with:
  - `quantityOnHand = quantity`
  - `quantityReserved = 0`
  - `quantityAvailable = quantity`

### Step 3: Insert Movement Record (Mandatory)
Always create audit record in `emcInventoryMovements`:
- `movementType = "StockReceipt"`
- `containerId = warehouseId`
- `containerType = "Warehouse"`
- Store reference, remarks, performer info
- Timestamp the operation

**Important:** Inventory must NEVER change without a corresponding movement record.

## Usage Examples

### Example 1: Initial Stock Receipt
```bash
curl -X POST http://localhost:3000/api/emc/inventory/stock-receipt \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": 12313,
    "warehouseId": "WH001",
    "itemId": "507f1f77bcf86cd799439011",
    "quantity": 500,
    "reference": "PO-2026-001",
    "remarks": "Initial stock receipt from supplier",
    "performedBy": "WAREHOUSE_MGR_001"
  }'
```

### Example 2: Restock Receipt
```bash
curl -X POST http://localhost:3000/api/emc/inventory/stock-receipt \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": 12313,
    "warehouseId": "WH002",
    "itemId": "507f1f77bcf86cd799439012",
    "quantity": 250,
    "reference": "PO-2026-002",
    "remarks": "Replenishment stock",
    "performedBy": "WAREHOUSE_MGR_002"
  }'
```

## Important Constraints

✅ **Implemented:**
- MongoDB transactions for data consistency
- Mandatory movement audit trail
- Warehouse lifecycle validation
- Product lifecycle validation
- Quantity validation

❌ **Not Implemented (Out of Scope):**
- Transfer to trolley
- Sales deduction
- Reservation logic
- Reconciliation
- Pricing
- Batch handling
- Lifecycle engine integration

## Monitoring & Debugging

### Check Inventory for Warehouse
Query MongoDB:
```javascript
db.containerInventory.find({
  organizationId: 12313,
  containerId: "WH001",
})
```

### Check Movement History
Query MongoDB:
```javascript
db.emcInventoryMovements.find({
  organizationId: 12313,
  containerId: "WH001",
}).sort({ performedAt: -1 }).limit(10)
```

### Verify Indexes
```javascript
db.containerInventory.getIndexes()
db.emcInventoryMovements.getIndexes()
```

## Integration Points

### For Developers Extending This Feature

1. **Add New Movement Types:**
   - Edit `emcInventoryMovements.ts` to add new movement types
   - Create corresponding service and endpoint

2. **Query Inventory:**
   ```typescript
   import { containerInventory } from '~/server/models/containerInventory'
   
   const inventory = await containerInventory.findOne({
     organizationId: 12313,
     containerId: "WH001",
     itemId: "507f1f77bcf86cd799439011"
   })
   ```

3. **Query Movements:**
   ```typescript
   import { emcInventoryMovements } from '~/server/models/emcInventoryMovements'
   
   const movements = await emcInventoryMovements.find({
     organizationId: 12313,
     movementType: "StockReceipt"
   }).sort({ performedAt: -1 })
   ```

## Environment Configuration

No special environment variables required. Uses existing MongoDB connection from `nuxt.config.ts`.

## Performance Notes

- Unique compound index on `containerInventory` ensures no duplicate records
- Movement sorting index (`performedAt: -1`) enables fast audit trail queries
- Organization-based filtering indexes support multi-tenant isolation
- Transaction support requires MongoDB Replica Set or Sharded Cluster

## Testing Considerations

1. **Valid Stock Receipt:** Item is ACTIVE, Warehouse is not ARCHIVED
2. **Warehouse Not Found:** Non-existent warehouse
3. **Product Not ACTIVE:** Product in DRAFT, SUSPENDED, or ARCHIVED state
4. **Invalid Quantity:** Negative, zero, decimal, or non-numeric
5. **Transaction Rollback:** Simulating failure scenarios

## Future Enhancements

- [ ] Batch stock receipt processing
- [ ] Return/reverse transactions
- [ ] Reconciliation & cycle counting
- [ ] Reservation logic integration
- [ ] Multi-location transfers
- [ ] Expiry date tracking
- [ ] Serial number tracking
