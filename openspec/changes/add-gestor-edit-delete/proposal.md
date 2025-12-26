# Change: Add Edit and Delete Gestor Capabilities

## Why
Managers can create gestores but cannot edit or delete them. If a manager makes a mistake (e.g., wrong name), they cannot correct it. Gestores can only be edited or deleted when they don't have assigned inventory to prevent data integrity issues.

## What Changes
- Add edit gestor functionality (opens modal with current name)
- Add delete gestor functionality (with validation)
- Validate that gestor does NOT have assigned inventory before allowing edit/delete
- Add PUT /api/users/:id for updating user name
- Show "Tiene inventario asignado" badge on gestores with inventory
- Disable edit/delete buttons for gestores with assigned inventory
- Display error message: "El gestor no puede ser editado ni eliminado porque tiene inventario asignado."
- Improve inventory assignment validation with detailed error messages for all fields

## Impact
- Affected specs: manager, inventory
- Affected code:
  - views/ManagerDashboard.tsx - GestoresView with edit/delete buttons and modal
  - views/ManagerDashboard.tsx - InventoryView with enhanced field validation
