# Change: Add Product-Specific Commission Rate for Manager

## Why
Currently all products in a store use the same commission rate (the store's default commission). However, managers should be able to set different commission rates for specific products based on their business needs (e.g., high-margin products might have lower commissions, or promotional items might have special rates). This gives managers more flexibility in pricing and commission structures.

## What Changes
- Add optional `commissionRate` field to Product type
- Add commission input field to product creation form in Manager dashboard
- Show store's default commission rate as placeholder in the commission field
- Update price calculation to use product-specific commission if defined, otherwise fall back to store default
- Display commission rate in product list (showing whether it's specific or default)

## Impact
- Affected specs: manager, pricing
- Affected code:
  - types.ts - Add commissionRate field to Product interface
  - utils.ts - Add getCommissionRateForProduct helper function
  - views/ManagerDashboard.tsx - Update ProductsView with commission input and display
