# Stock Receipt on Item Attachment Integration

## Overview
When any item is attached to a warehouse with a quantity, the system automatically creates a stock receipt. This ensures that all warehouse goods inbound flow through the inventory tracking system.

## Business Rule
```
on Attach on Item where target is warehouse and child is item then this needs to be treated as stockreceipt
```

## Implementation Details

### 1. **Entry Point: Container Association API**
- **Endpoint**: `POST /api/emc/container-associations`
- **Location**: [server/api/emc/container-associations.post.ts](server/api/emc/container-associations.post.ts)
- **Responsibility**: Receives attach request with quantity and routes to status manager

### 2. **Status Manager Processing**
- **Function**: `updateContainerStatus()` → `handleAttachAction()`
- **Location**: [server/utils/containerStatusManager.ts](server/utils/containerStatusManager.ts) (Line ~425)
- **Responsibility**: 
  - Validates parent is a Warehouse
  - Validates child is an Item (or product)
  - Triggers stock receipt if both conditions are met

### 3. **Stock Receipt Service**
- **Function**: `processStockReceipt()`
- **Location**: [server/utils/stockReceiptService.ts](server/utils/stockReceiptService.ts)
- **Responsibility**:
  - Validates warehouse exists and is not archived
  - Validates product is active
  - Validates quantity is numeric and positive
  - Updates or creates container inventory records
  - Creates inventory movement audit record

## Workflow Sequence

```
1. Frontend User Action
   └─> emcContainer.vue - confirmQuantityAndAttach()
       └─> Sends: {parentContainerId, childContainerIds, quantity}

2. API Processing
   └─> /api/emc/container-associations POST
       └─> Validates parent & children
       └─> Calls updateContainerStatus()

3. Status Manager
   └─> handleAttachAction(parent, child, quantity)
       ├─> Validates parent type === 'Warehouse'
       ├─> Validates child type === 'Item' OR loads product from emcInvItem
       └─> If both valid AND quantity > 0:
           └─> processStockReceipt()

4. Stock Receipt Processing
   └─> Creates inventory records
   └─> Creates movement audit trail
   └─> Returns receipt data
```

## Key Features

### ✅ Automatic Trigger
- No additional user input required
- Quantity collected during attach dialog automatically used

### ✅ Product Fallback Handling
- If child ID points to inventory product (not a container)
- System automatically treats it as type='Item'
- Enables stock receipt without pre-creating containers

### ✅ Validation
- Warehouse must exist and not be archived
- Product must be active (lifecycle='ACTIVE')
- Quantity must be integer > 0

### ✅ Audit Trail
- Movement record tracks attachment action
- Inventory movement record tracks stock receipt
- Both linked via timestamps and IDs

## Example Log Output

```
=== API: Container Association ===
📦 Association Payload: {
  actionId: 'ATTACH',
  parentContainerId: 'WH-MUM-01',  // Mumbai Warehouse
  childContainerIds: ['69771f81e4160e32ce3e99a8'],  // Travel Makeup Kit
  quantity: 50
}

→ Routing to handleAttachAction

✅ Parent found: WH-MUM-01 (Type: Warehouse)
✅ Child found: 69771f81e4160e32ce3e99a8 (Type: Item)

📦 [Stock Receipt] Warehouse + Item detected!
   Parent: Mumbai International Warehouse [Type: Warehouse]
   Child: Travel Makeup Kit 01 [Type: Item]
   Quantity: 50
   Processing stock receipt...

📥 Processing stock receipt: {
  warehouseId: 'WH-MUM-01',
  itemId: '69771f81e4160e32ce3e99a8',
  quantity: 50,
  reference: 'ATTACH-WH-MUM-01-69771f81e4160e32ce3e99a8-1708...'
}

✅ Stock Receipt Completed Successfully
   → Movement ID: 12345
   → Inventory ID: 54321
   → Previous Qty: 0 → New Qty: 50
```

## Configuration

No configuration required. The integration is automatic based on:
1. Parent container type = 'Warehouse'
2. Child container type = 'Item'
3. Quantity > 0

## Testing

### Test Case 1: Container-to-Warehouse Attachment
1. Create Item container with type='Item'
2. Attach to Warehouse with quantity
3. Verify stock receipt created ✅

### Test Case 2: Product-to-Warehouse Attachment
1. Select product from inventory (no container created)
2. Attach to Warehouse with quantity
3. System auto-creates virtual Item container
4. Stock receipt processed ✅

### Test Case 3: Edge Cases
- Zero quantity → No stock receipt
- Negative quantity → Rejected
- Non-integer quantity → Rejected
- Missing product → Error returned
- Archived warehouse → Rejected

## Files Modified/Created

- [server/utils/containerStatusManager.ts](server/utils/containerStatusManager.ts) - Enhanced handleAttachAction() with product fallback
- [server/utils/stockReceiptService.ts](server/utils/stockReceiptService.ts) - Stock receipt validation & processing (existing)
- [server/api/emc/container-associations.post.ts](server/api/emc/container-associations.post.ts) - API endpoint (existing)

## Future Enhancements

1. **Batch Receipts**: Support multiple items in single receipt
2. **Receipt Templates**: Store receipt templates for common goods inbound flows
3. **Quality Inspection**: Add QC step before stock receipt completion
4. **Document Attachment**: Support PO, invoice, GRN attachments
5. **Putaway Workflow**: Auto-generate putaway tasks after receipt
