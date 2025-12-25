# Change: Add Exchange Rate Validation and Display

## Why
Currently managers can add products without verifying that an exchange rate exists, which leads to incorrect pricing. Products display pricing based on the exchange rate, so it's critical to ensure a valid exchange rate exists before product creation. Additionally, the current exchange rate should always be visible in the UI for managers and gestors to make informed decisions.

## What Changes
- Add exchange rate validation before allowing product creation in Manager dashboard
- Display current exchange rate in the header/sidebar for all roles that need pricing information (Manager, Gestor)
- Show calculated final price (including commission) when listing products in Manager dashboard
- Display warning message if no exchange rate is configured

## Impact
- Affected specs: manager, pricing
- Affected code:
  - components/Layout.tsx - Add exchange rate display in header
  - views/ManagerDashboard.tsx - ProductsView validation and price display
  - utils.ts - Already has getCurrentExchangeRate and calculateProductPrices functions
  - types.ts - No changes needed
