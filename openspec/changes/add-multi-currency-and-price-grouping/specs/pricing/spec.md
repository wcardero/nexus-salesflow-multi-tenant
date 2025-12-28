# Spec: Multi-Currency Product Pricing

## Overview
System SHALL support product costs in both USD and MN currencies. Price calculation SHALL correctly handle both currencies and SHALL include the gestor commission in the final price. This allows managers to create products with local currency costs without relying on exchange rates.

## Requirements

### 1. Product Cost Currency Support
**Location**: `types.ts` - Product interface
- Product SHALL have `costUSD` field (optional, nullable) for USD costs
- Product SHALL have `costMN` field (optional) for MN costs
- Product SHALL have `currency` field (optional, default: 'USD') with values 'USD' or 'MN'
- When currency is 'USD', `costUSD` MUST be set and `costMN` SHALL be null
- When currency is 'MN', `costMN` MUST be set and `costUSD` SHALL be null

#### Scenario: Create product with USD cost
- **WHEN** manager creates a product with currency='USD' and costUSD=1
- **THEN** product stores costUSD=1, costMN=null, currency='USD'

#### Scenario: Create product with MN cost
- **WHEN** manager creates a product with currency='MN' and costMN=200
- **THEN** product stores costMN=200, costUSD=null, currency='MN'

### 2. Price Calculation with Gestor Commission
**Location**: `utils.ts` - calculateProductPrices
- Final product price SHALL include the gestor commission
- Price calculation for MN: `basePrice = costMN × (1 + margin)`, then `gestorCommission = basePrice × commissionRate`, then `finalPrice = basePrice + gestorCommission`
- Price calculation for USD: `basePriceMN = costUSD × (1 + margin) × exchangeRate`, then `gestorCommission = basePriceMN × commissionRate`, then `finalPriceMN = basePriceMN + gestorCommission`
- `gestorCommissionMN` field SHALL store the commission amount

#### Scenario: Calculate price for MN product
- **WHEN** product has costMN=200, margin=0.5, commissionRate=0.1
- **THEN** basePrice = 200 × 1.5 = 300 MN
- **THEN** gestorCommission = 300 × 0.1 = 30 MN
- **THEN** finalPrice = 300 + 30 = 330 MN

#### Scenario: Calculate price for USD product
- **WHEN** product has costUSD=1, margin=0.5, commissionRate=0.1, exchangeRate=300
- **THEN** basePriceMN = 1 × 1.5 × 300 = 450 MN
- **THEN** gestorCommission = 450 × 0.1 = 45 MN
- **THEN** finalPriceMN = 450 + 45 = 495 MN

### 3. Database Schema Updates
**Location**: Database schema
- Product table SHALL have `costMN` column (REAL, nullable)
- Product table SHALL have `currency` column (TEXT, default 'USD')
- Product table SHALL have `priceMN` column (REAL) to store calculated final price
- Product table SHALL have `gestorCommissionMN` column (REAL) to store commission amount
- Product table SHALL have `createdBy` column (TEXT) to store creator user ID
- `costUSD` column SHALL be made nullable to support MN-only products

#### Scenario: Migration adds new columns
- **WHEN** migration script runs
- **THEN** costMN, currency, priceMN, gestorCommissionMN, and createdBy columns exist
- **THEN** costUSD column allows null values

### 4. Backend Product Creation
**Location**: `backend/src/index.ts` - POST /api/products
- Endpoint SHALL accept `currency`, `costMN`, `costUSD` fields
- Validation SHALL require at least one cost field (costUSD or costMN)
- Validation SHALL require currency field when costMN is provided
- Endpoint SHALL calculate priceMN including gestor commission
- Endpoint SHALL save priceMN and gestorCommissionMN to database

#### Scenario: Create MN product via API
- **WHEN** POST /api/products with name="Jabón", costMN=200, margin=0.5, currency='MN', commissionRate=0.1
- **THEN** product is created with costMN=200, costUSD=null, currency='MN'
- **THEN** priceMN=330 (200 × 1.5 + (300 × 0.1))
- **THEN** gestorCommissionMN=30

### 5. Backend Product Update
**Location**: `backend/src/index.ts` - PUT /api/products/:id
- Endpoint SHALL support updating both costUSD and costMN
- Endpoint SHALL recalculate priceMN on update
- Endpoint SHALL update gestorCommissionMN on recalculation

#### Scenario: Update product cost
- **WHEN** updating product from costMN=200 to costMN=250
- **THEN** priceMN is recalculated: 250 × 1.5 + (375 × 0.1) = 412.5
- **THEN** gestorCommissionMN is updated: 375 × 0.1 = 37.5
