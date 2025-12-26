## 1. Implementation
- [x] 1.1 Add state variables for editing products in ManagerDashboard
- [x] 1.2 Add isProductAssignedToGestor validation function
- [x] 1.3 Add edit product functionality with modal form
- [x] 1.4 Add delete product functionality with validation
- [x] 1.5 Show "Asignado a gestor" badge on assigned products
- [x] 1.6 Disable edit/delete buttons for assigned products
- [x] 1.7 Display error message when trying to edit/delete assigned products
- [x] 1.8 Confirm delete action with confirmation dialog
- [x] 1.9 Add API calls for edit/delete operations (PUT /api/products/:id, DELETE /api/products/:id)
- [x] 1.10 Add refreshDb call after edit/delete to update UI
- [x] 1.11 Backend validation: check InventoryItem table for assigned products
- [x] 1.12 Backend validation: ProductStock does NOT count as assignment

## 2. Testing
- [x] 2.1 Verify edit button works for unassigned products
- [x] 2.2 Verify delete button works for unassigned products
- [x] 2.3 Verify edit/delete buttons are disabled for assigned products
- [x] 2.4 Verify error message displays when trying to edit assigned product
- [x] 2.5 Verify error message displays when trying to delete assigned product
- [x] 2.6 Verify product in stock initial can be edited and deleted (not assigned)
- [x] 2.7 Verify product assigned to gestor cannot be edited
- [x] 2.8 Verify product assigned to gestor cannot be deleted
- [x] 2.9 Test editing product updates all fields correctly
- [x] 2.10 Test delete confirmation dialog works
