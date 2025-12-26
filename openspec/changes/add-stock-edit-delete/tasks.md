## 1. Implementation
- [x] 1.1 Add state variables for editing stock in StockView
- [x] 1.2 Add isStockAssignedToGestor validation function
- [x] 1.3 Add edit stock functionality with modal form
- [x] 1.4 Add delete stock functionality with validation
- [x] 1.5 Add DELETE /api/product-stock/:stockId endpoint in backend
- [x] 1.6 Show "Asignado a gestor" badge on stock records that are assigned
- [x] 1.7 Disable edit/delete buttons for assigned stock
- [x] 1.8 Display error message when trying to edit/delete assigned stock
- [x] 1.9 Confirm delete action with confirmation dialog
- [x] 1.10 Backend validation: check AssignedInventory for product assignments

## 2. Testing
- [ ] 2.1 Verify edit button works for unassigned stock
- [ ] 2.2 Verify delete button works for unassigned stock
- [ ] 2.3 Verify edit/delete buttons are disabled for assigned stock
- [ ] 2.4 Verify error message displays when trying to edit assigned stock
- [ ] 2.5 Verify error message displays when trying to delete assigned stock
- [ ] 2.6 Test editing stock updates quantity correctly (100→90)
- [ ] 2.7 Test deleting stock removes record from database
- [ ] 2.8 Verify modal overlay has proper styling
- [ ] 2.9 Test with multiple stock records
