## 1. Implementation
- [x] 1.1 Add state variables for editing gestores in GestoresView
- [x] 1.2 Add isGestorHasInventory validation function
- [x] 1.3 Add edit gestor functionality with modal form
- [x] 1.4 Add delete gestor functionality with validation
- [x] 1.5 Show "Tiene inventario asignado" badge on gestores with inventory
- [x] 1.6 Disable edit/delete buttons for gestores with assigned inventory
- [x] 1.7 Display error message when trying to edit/delete gestor with inventory
- [x] 1.8 Confirm delete action with confirmation dialog
- [x] 1.9 Enhance inventory assignment validation with detailed error messages
- [x] 1.10 Validate all inventory assignment fields (product, gestor, quantity)
- [x] 1.11 Fix GET /api/users to get storeId from _StoreToUser if not in User table
- [x] 1.12 Fix POST /api/login to check _StoreToUser when user.storeId doesn't match selected store

## 2. Testing
- [x] 2.1 Verify edit button works for gestores without inventory
- [x] 2.2 Verify delete button works for gestores without inventory
- [x] 2.3 Verify edit/delete buttons are disabled for gestores with inventory
- [x] 2.4 Verify error message displays when trying to edit gestor with inventory
- [x] 2.5 Verify error message displays when trying to delete gestor with inventory
- [x] 2.6 Verify inventory assignment validates all fields with detailed messages
- [x] 2.7 Verify modal allows password change (optional)
- [x] 2.8 Test editing gestor name updates correctly
- [x] 2.9 Test deleting gestor removes from database
- [ ] 2.10 Verify gestores are listed correctly after Manager logs in
- [ ] 2.11 Verify duplicate name validation works correctly
