## 1. Implementation
- [x] 1.1 Add exchange rate display in Layout.tsx header component
- [x] 1.2 Update App.tsx to pass `store` prop to Layout component
- [x] 1.3 Add exchange rate validation in ManagerDashboard ProductsView before creating products
- [x] 1.4 Display warning message when no exchange rate is configured
- [x] 1.5 Disable "Agregar Producto" button when no exchange rate exists
- [x] 1.6 Show calculated final price (with exchange rate and commission) in product list
- [x] 1.7 Import calculateProductPrices and getCurrentExchangeRate in ManagerDashboard
- [x] 1.8 Test exchange rate validation and price display functionality

## 2. Testing
- [ ] 2.1 Verify exchange rate displays correctly in header when configured
- [ ] 2.2 Verify warning message shows when no exchange rate is configured
- [ ] 2.3 Verify product creation is blocked without exchange rate
- [ ] 2.4 Verify calculated prices display correctly in product list
- [ ] 2.5 Test with multiple exchange rate changes to ensure correct current rate is shown
