# Change: Add Edit and Delete Gestor Capabilities

## Why
Managers can create gestores but cannot edit or delete them. If a manager makes a mistake (e.g., wrong name), they cannot correct it. Gestores can only be edited or deleted when they don't have assigned inventory to prevent data integrity issues.

Also, gestores were not being listed correctly when Managers logged in because the storeId was being retrieved from the User table (which might be null for Managers assigned via _StoreToUser). This prevented managers from seeing their gestores after logging in.

## What Changes
- Add edit gestor functionality (opens modal with current name)
- Add delete gestor functionality (with validation)
- Validate that gestor does NOT have assigned inventory before allowing edit/delete
- Add PUT /api/users/:id for updating user name (now allows Managers to update gestors)
- Show "Tiene inventario asignado" badge on gestores with inventory
- Disable edit/delete buttons for gestores with assigned inventory
- Display error message: "El gestor no puede ser editado ni eliminado porque tiene inventario asignado."
- Improve inventory assignment validation with detailed error messages for all fields
- Fix POST /api/login to check _StoreToUser when user.storeId doesn't match selected store
- Fix GET /api/users to get storeId from _StoreToUser if not in User table
- Fix App.tsx refreshDb to include 'users' resource for Managers and Directors
- Fix DELETE /api/users/:id to delete AuditLog and InventoryItem records first (foreign key constraints)
- Fix InventoryView to include Authorization header in inventory assignment
- This ensures Managers can see their gestores correctly after logging in

## Impact
- Affected specs: manager, inventory
- Affected code:
  - backend/src/index.ts - POST /api/login, GET /api/users, PUT /api/users/:id, DELETE /api/users/:id
  - App.tsx - refreshDb function
  - views/ManagerDashboard.tsx - GestoresView with edit/delete buttons and modal, InventoryView with Authorization header
