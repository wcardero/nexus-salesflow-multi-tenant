# Spec: Inventory Price Grouping

## Overview
When managers assign inventory to gestors in multiple batches with the same price, the system SHALL automatically group them together upon confirmation. This simplifies inventory management by showing consolidated quantities instead of individual assignment records.

## Requirements

### 1. Inventory Price Storage
**Location**: `backend/src/index.ts` - POST /api/assigned-inventory/:id/confirm
- When gestor confirms inventory assignment, `priceMN` SHALL be calculated and stored
- Price calculation SHALL use product's cost, margin, exchange rate, and commission
- `priceMN` SHALL be frozen at confirmation time and never change

#### Scenario: Confirm inventory with price calculation
- **WHEN** gestor confirms assignment of 5 units of product
- **THEN** system calculates priceMN based on product's cost, margin, and current exchange rate
- **THEN** priceMN is stored in AssignedInventory record
- **THEN** gestor's inventory shows 5 units at that specific price

### 2. Automatic Inventory Grouping on Confirmation
**Location**: `backend/src/index.ts` - POST /api/assigned-inventory/:id/confirm
- When confirming inventory, system SHALL check for existing confirmed inventory with same product, gestor, and priceMN
- If existing inventory found with matching criteria:
  - Quantity SHALL be added to existing record
  - Pending record SHALL be deleted
  - Audit log SHALL record the merge operation
- If no existing inventory found:
  - Pending record SHALL be confirmed with priceMN
  - Inventory SHALL be added as new group

#### Scenario: Grouping when confirming second batch
- **WHEN** gestor has 5 confirmed units at priceMN=300
- **AND** manager assigns 10 more units of same product at same price
- **AND** gestor confirms the 10 units
- **THEN** system finds existing 5-unit group at priceMN=300
- **THEN** system merges: 5 + 10 = 15 units at priceMN=300
- **THEN** pending 10-unit record is deleted
- **THEN** gestor sees single group of 15 units at priceMN=300

#### Scenario: No grouping when price differs
- **WHEN** gestor has 5 confirmed units at priceMN=300
- **AND** manager assigns 10 units of same product (but with different cost, so priceMN=350)
- **AND** gestor confirms the 10 units
- **THEN** system does not find existing group at priceMN=350
- **THEN** system confirms as new group: 10 units at priceMN=350
- **THEN** gestor sees two separate groups: 5 at priceMN=300 and 10 at priceMN=350

### 3. Manager Inventory Display Grouping
**Location**: `views/ManagerDashboard.tsx` - InventoryView
- Manager's inventory view SHALL split into two sections:
  1. Pending inventory (not yet confirmed by gestor)
  2. Confirmed inventory (grouped by product, gestor, and price)
- Confirmed inventory SHALL show aggregated quantities per (product, gestor, price) group
- Each group SHALL display product name, gestor name, price, and total quantity

#### Scenario: Manager sees grouped confirmed inventory
- **WHEN** manager views inventory for a gestor
- **THEN** pending section shows individual assignments with "Pending" status
- **THEN** confirmed section shows groups like:
  - Product: Jabón, Gestor: Juan, Price: $300 MN, Quantity: 15
  - Product: Jabón, Gestor: Juan, Price: $350 MN, Quantity: 10

### 4. Gestor Inventory Display Grouping
**Location**: `views/GestorDashboard.tsx` - SalesView
- Gestor's available inventory SHALL be grouped by product and price
- Each group SHALL show product name, price, and total quantity
- Gestor SHALL see consolidated quantities instead of individual assignment records

#### Scenario: Gestor sees grouped inventory
- **WHEN** gestor views available inventory
- **THEN** inventory is grouped like:
  - Product: Jabón, Price: $300 MN, Quantity: 15, Button: "Vender"
  - Product: Cepillo, Price: $200 MN, Quantity: 8, Button: "Vender"
- **THEN** clicking "Vender" on 15-unit group sells from that group

### 5. Database Schema for Price Grouping
**Location**: AssignedInventory table
- `priceMN` column SHALL be added to store frozen price at confirmation
- Index SHALL exist on (productId, gestorId, priceMN) for grouping queries

#### Scenario: Schema update adds priceMN
- **WHEN** migration to add priceMN column is executed
- **THEN** AssignedInventory table has priceMN column (REAL)
- **THEN** Index exists on (productId, gestorId, priceMN)
