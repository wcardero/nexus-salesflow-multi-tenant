## 1. Implementation
- [x] 1.1 Add state variables for editing stock in StockView
- [x] 1.2 Add isStockAssignedToGestor validation function (for badge warning)
- [x] 1.3 Add edit stock functionality with modal form
- [x] 1.4 Add delete stock functionality with validation
- [x] 1.5 Add DELETE /api/product-stock/:stockId endpoint in backend
- [x] 1.6 Show "Asignado a gestor" badge on stock records that are assigned (visual warning)
- [x] 1.7 Remove disabled state from edit/delete buttons for assigned stock (NEW: allow editing/deleting)
- [x] 1.8 Remove backend validation that blocks stock edit/delete when product has assignments (NEW)
- [x] 1.9 Confirm delete action with confirmation dialog
- [x] 1.10 Maintain audit logs for UPDATE_STOCK and DELETE_STOCK actions

## 2. Testing
- [ ] 2.1 Verify edit button works for stock with active assignments
- [ ] 2.2 Verify delete button works for stock with active assignments
- [ ] 2.3 Verify "Asignado a gestor" badge is displayed as visual warning
- [ ] 2.4 Verify editing stock updates quantity correctly (e.g., 10→15 when 5 units are assigned)
- [ ] 2.5 Verify deleting stock removes record from database (or sets quantity to 0)
- [ ] 2.6 Verify modal overlay has proper styling
- [ ] 2.7 Test with multiple stock records
- [ ] 2.8 Verify audit logs are created for all stock operations
- [ ] 2.9 Verify system prevents assigning more stock than available in ProductStock
- [ ] 2.10 Verify product definition editing remains blocked when there are assignments
