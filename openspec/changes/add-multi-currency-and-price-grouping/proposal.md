# Change: Add Multi-Currency Product Support and Inventory Price Grouping

## Why
Currently the system only supports products with USD cost, but businesses in the region operate primarily in MN (local currency). Managers need the ability to create products with costs in MN directly, without relying on exchange rates. Additionally, when a manager assigns inventory to a gestor in multiple batches (e.g., 5 units, then 10 more units) with the same price, the system should automatically group them together to simplify inventory management. Finally, the final product price should include the gestor commission to provide accurate pricing information.

## What Changes
- Add multi-currency support to Product model (USD and MN currencies)
- Add `costMN`, `currency`, `priceMN`, `gestorCommissionMN`, and `createdBy` fields to Product type
- Update product creation/editing forms to support currency selection
- Update price calculation to correctly handle both USD and MN costs
- Ensure final product price includes gestor commission (not just base price)
- Implement automatic inventory grouping by product, gestor, and price when confirming assignments
- Update product listing to show currency badge and correct cost
- Add database migrations for new Product columns
- Remove obsolete product-endpoints.ts file

## Impact
- Affected specs: pricing, manager, inventory
- Affected code:
  - backend/src/index.ts - Product CRUD endpoints, inventory confirmation logic
  - types.ts - Product interface with new fields
  - utils.ts - Price calculation utilities
  - views/ManagerDashboard.tsx - Product creation/listing UI
  - views/GestorDashboard.tsx - Inventory grouping display
  - Backend migrations - Add new columns to Product table
