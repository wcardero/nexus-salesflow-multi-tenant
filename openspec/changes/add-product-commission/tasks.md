## 1. Implementation
- [x] 1.1 Add optional `commissionRate` field to Product interface in types.ts
- [x] 1.2 Create `getCommissionRateForProduct` helper function in utils.ts
- [x] 1.3 Add commission input field to product creation form in ManagerDashboard
- [x] 1.4 Show store's default commission rate as placeholder in commission field
- [x] 1.5 Update product list display to show commission rate (specific vs default)
- [x] 1.6 Update price calculation to use product-specific commission when available
- [x] 1.7 Import `getCommissionRateForProduct` in ManagerDashboard
- [x] 1.8 Test commission rate selection and price calculation

## 2. Testing
- [ ] 2.1 Verify default commission rate is shown as placeholder in product creation form
- [ ] 2.2 Verify product can be created without specifying commission (uses store default)
- [ ] 2.3 Verify product can be created with specific commission rate
- [ ] 2.4 Verify product list shows commission rate correctly (specific vs default)
- [ ] 2.5 Verify price calculation uses correct commission rate
- [ ] 2.6 Test multiple products with different commission rates
- [ ] 2.7 Verify changing product commission updates displayed price correctly
