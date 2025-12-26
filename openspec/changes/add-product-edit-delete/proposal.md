# Change: Add Edit and Delete Product Capabilities for Manager

## Why
Managers need to edit and delete products to maintain accurate product information (prices, margins, commissions) and remove obsolete items. However, to maintain data integrity, products can only be edited or deleted when they have NOT been assigned to any gestor. Products in stock initial (ProductStock) remain editable/deletable since they haven't been distributed to sales representatives.

## What Changes
- Add edit product functionality (opens modal with product data)
- Add delete product functionality (with validation)
- Validate that product is NOT assigned to any gestor before allowing edit/delete
- Validation checks InventoryItem table for assignments (not ProductStock)
- Show "Asignado a gestor" badge on assigned products
- Disable edit/delete buttons for assigned products
- Display error message: "El producto no puede ser editado ni eliminado porque se encuentra asignado a un gestor."
- Stock initial (ProductStock) does NOT count as assigned

## Impact
- Affected specs: manager, inventory
- Affected code:
  - views/ManagerDashboard.tsx - ProductsView with edit/delete buttons and modal
  - backend/src/index.ts - PUT /api/products/:id and DELETE /api/products/:id validation
