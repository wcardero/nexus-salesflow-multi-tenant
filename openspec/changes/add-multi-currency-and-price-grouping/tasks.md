## 1. Database Migrations
- [ ] 1.1 Create migration script to add `createdBy`, `costMN`, `currency`, `priceMN`, and `gestorCommissionMN` columns to Product table
- [ ] 1.2 Make `costUSD` column nullable to support MN-only products
- [ ] 1.3 Create migration to add `priceMN` column to AssignedInventory table
- [ ] 1.4 Execute migrations on development database

## 2. Backend - Product Type Updates
- [ ] 2.1 Update Product interface in types.ts with new fields
- [ ] 2.2 Add validation middleware for product creation (make costUSD/costMN optional)
- [ ] 2.3 Add currency validation (USD or MN)

## 3. Backend - Product Creation Endpoint
- [ ] 3.1 Update POST /api/products to handle both USD and MN costs
- [ ] 3.2 Calculate correct priceMN based on currency
- [ ] 3.3 Include gestor commission in final price calculation
- [ ] 3.4 Save all new fields (costMN, currency, priceMN, gestorCommissionMN, createdBy)
- [ ] 3.5 Handle duplicate product name check correctly

## 4. Backend - Product Update Endpoint
- [ ] 4.1 Update PUT /api/products/:id to handle both USD and MN costs
- [ ] 4.2 Recalculate priceMN when updating
- [ ] 4.3 Include gestor commission in recalculated price
- [ ] 4.4 Support currency changes

## 5. Backend - Inventory Confirmation Logic
- [ ] 5.1 Update POST /api/assigned-inventory/:id/confirm endpoint
- [ ] 5.2 Calculate priceMN when confirming inventory
- [ ] 5.3 Check for existing inventory with same product, gestor, and price
- [ ] 5.4 If found, merge quantities and delete pending record
- [ ] 5.5 If not found, confirm with priceMN

## 6. Backend - Validation and Migration Endpoints
- [ ] 6.1 Create endpoint to execute product columns migration
- [ ] 6.2 Add migration endpoint to add priceMN to AssignedInventory

## 7. Frontend - Utilities
- [ ] 7.1 Update calculateProductPrices in utils.ts
- [ ] 7.2 Fix commission calculation (not double-counting)
- [ ] 7.3 Handle both USD and MN cost calculations
- [ ] 7.4 Ensure final price includes gestor commission

## 8. Frontend - Manager Dashboard - Product Creation
- [ ] 8.1 Add currency selector (USD/MN) to product form
- [ ] 8.2 Update cost input placeholder based on currency
- [ ] 8.3 Fix price calculation to include gestor commission
- [ ] 8.4 Send correct cost field (costUSD or costMN) based on currency

## 9. Frontend - Manager Dashboard - Product List
- [ ] 9.1 Show currency badge for each product
- [ ] 9.2 Display correct cost based on currency (USD or MN)
- [ ] 9.3 Show priceMN from database if available
- [ ] 9.4 Fallback to recalculation for old products

## 10. Frontend - Gestor Dashboard - Inventory Display
- [ ] 10.1 Create groupedInventory useMemo hook
- [ ] 10.2 Group inventory by productId and priceMN
- [ ] 10.3 Show quantity, price, and product name for each group
- [ ] 10.4 Pass groupedInventory to SalesView component

## 11. Frontend - Manager Dashboard - Inventory View
- [ ] 11.1 Create groupedAssignedInventory useMemo hook
- [ ] 11.2 Split inventory display: Pending and Confirmed tabs
- [ ] 11.3 Show pending inventory with status indicator
- [ ] 11.4 Show confirmed inventory grouped by product, gestor, and price
- [ ] 11.5 Display priceMN for each group

## 12. Cleanup
- [ ] 12.1 Remove obsolete backend/src/product-endpoints.ts file
- [ ] 12.2 Archive product-endpoints.ts.bak if needed
- [ ] 12.3 Clean up temporary migration scripts
- [ ] 12.4 Run type checking and fix any errors

## 13. Testing
- [ ] 13.1 Test creating product in USD
- [ ] 13.2 Test creating product in MN
- [ ] 13.3 Verify price calculation includes gestor commission
- [ ] 13.4 Test inventory confirmation with price grouping
- [ ] 13.5 Test assigning inventory in batches (5, then 10 units)
- [ ] 13.6 Verify Manager shows grouped inventory correctly
- [ ] 13.7 Verify Gestor shows grouped inventory correctly
