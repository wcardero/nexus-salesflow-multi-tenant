# Change: Add Edit and Delete Product Capabilities for Manager

## Why
Currently managers can create products but cannot edit or delete them. This limits their ability to update product information (prices, margins, commissions) or remove products that are no longer relevant. Additionally, products should only be editable/deletable when they're not assigned to gestors to prevent data integrity issues.

## What Changes
- Add edit product functionality (opens modal with product data)
- Add delete product functionality (with validation)
- Validate that product is not assigned to any gestor before allowing edit/delete
- Show "Asignado a gestor" badge on assigned products
- Disable edit/delete buttons for assigned products
- Display error message: "El producto no puede ser editado ni eliminado porque se encuentra asignado a un gestor."
- Stock initial (ProductStock) does NOT count as assigned

## Impact
- Affected specs: manager, inventory
- Affected code:
  - views/ManagerDashboard.tsx - ProductsView with edit/delete buttons and modal
