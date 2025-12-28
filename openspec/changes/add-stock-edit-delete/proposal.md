# Change: Allow Edit and Delete Product Stock with Active Assignments

## Why
Managers can add initial stock (ProductStock) but currently cannot edit or delete these records when a product has active assignments to gestors. This creates operational issues:

1. **Correction of errors**: If a manager accidentally enters wrong quantities (e.g., 100 items instead of 90), they cannot correct this error once the product is assigned.
2. **Stock adjustments**: Managers need to adjust stock levels for new purchases, shrinkage, damage, or theft.
3. **Logical separation**: ProductStock represents warehouse inventory (not assigned), while AssignedInventory represents inventory delivered to gestors. These are separate entities and should be managed independently.

## Rationale

### Why is it safe to allow editing/deleting ProductStock with active assignments?

1. **No double-counting**: When stock is assigned to a gestor, the system automatically reduces ProductStock. There is no risk of counting inventory twice.

2. **Separate entities**: ProductStock = warehouse inventory (available to assign), AssignedInventory = inventory delivered to gestors. Editing one doesn't affect the other.

3. **Business continuity**: Gestors with active assignments can continue selling their assigned inventory. Manager can adjust warehouse stock independently.

4. **Data integrity maintained**: The system validates that managers cannot assign more than available ProductStock. This validation remains intact.

### What remains blocked?

- **Product definition editing**: Name, cost, margin, commission rate - BLOCKED when there are active assignments (affects calculated prices)
- **Product deletion**: BLOCKED when there are active assignments (integrity reference)

## What Changes
- **Allow edit** of ProductStock quantity even when product has active AssignedInventory records
- **Allow delete** of ProductStock records even when product has active AssignedInventory records
- **Remove restriction** that blocked edit/delete when product is assigned to gestors
- **Maintain audit logs** for all stock operations (UPDATE_STOCK, DELETE_STOCK)
- **Show visual warning** ("Asignado a gestor" badge) when product has assignments, to inform managers
- **Maintain validation**: Managers cannot assign more stock than available in ProductStock

## Impact
- Affected specs: inventory
- Affected code:
  - backend/src/index.ts - Remove assignment check from DELETE /api/product-stock/:stockId endpoint
  - views/ManagerDashboard.tsx - Remove disabled state from stock edit/delete buttons
