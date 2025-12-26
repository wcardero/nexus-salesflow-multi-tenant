# Change: Add Edit and Delete Product Stock Capabilities

## Why
Managers can add initial stock (ProductStock) but cannot edit or delete these records. If a manager accidentally enters wrong quantities (e.g., 100 items instead of 90), they cannot correct this error. Stock records should only be editable/deletable when the product is NOT assigned to any gestor to prevent data integrity issues.

## What Changes
- Add edit stock functionality (opens modal with current quantity)
- Add delete stock functionality (with validation)
- Validate that product is NOT assigned to any gestor before allowing edit/delete
- Add endpoint `DELETE /api/product-stock/:stockId` for deleting stock records
- Show "Asignado a gestor" badge on stock records that are assigned
- Disable edit/delete buttons for stock of assigned products
- Display error message: "El producto no puede ser eliminado del stock porque se encuentra asignado a un gestor."

## Impact
- Affected specs: inventory
- Affected code:
  - views/ManagerDashboard.tsx - StockView with edit/delete buttons and modal
  - backend/src/index.ts - DELETE /api/product-stock/:stockId endpoint
