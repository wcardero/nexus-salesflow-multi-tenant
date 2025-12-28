# Spec: Multi-Currency Product Management

## Overview
Managers SHALL be able to create and manage products in both USD and MN currencies. Product listing SHALL display correct currency badge and cost based on product's currency setting. This provides flexibility for businesses operating primarily in local currency.

## Requirements

### 1. Product Creation Form Currency Selection
**Location**: `views/ManagerDashboard.tsx` - ProductsView
- Product creation form SHALL include currency selector (USD or MN)
- Cost input placeholder SHALL update based on selected currency
- Form SHALL validate that cost field matches currency selection

#### Scenario: Create product with USD currency
- **WHEN** manager selects "USD" in currency selector
- **THEN** cost input shows placeholder "Costo (USD)"
- **WHEN** manager enters name, cost, margin and submits
- **THEN** product is created with currency='USD' and costUSD set

#### Scenario: Create product with MN currency
- **WHEN** manager selects "MN" in currency selector
- **THEN** cost input shows placeholder "Costo (MN)"
- **WHEN** manager enters name, cost, margin and submits
- **THEN** product is created with currency='MN' and costMN set

### 2. Product List Currency Display
**Location**: `views/ManagerDashboard.tsx` - ProductsView
- Product list SHALL show currency badge for each product
- Currency badge SHALL display "USD" or "MN" based on product's currency field
- Cost display SHALL use correct cost field (costUSD or costMN)
- Products without currency field SHALL default to "USD"

#### Scenario: Product list shows USD products
- **WHEN** manager views product list
- **THEN** USD products show "USD" badge
- **THEN** cost displays as "$1.00" format

#### Scenario: Product list shows MN products
- **WHEN** manager views product list
- **THEN** MN products show "MN" badge
- **THEN** cost displays as "$200.00" format (using MN currency formatting)

### 3. Product Update Currency Support
**Location**: `views/ManagerDashboard.tsx` - ProductsView
- Product edit form SHALL support currency changes
- Cost field SHALL update based on selected currency
- Price SHALL be recalculated when currency changes

#### Scenario: Update product currency
- **WHEN** manager edits a USD product and changes currency to MN
- **THEN** form prompts for MN cost
- **WHEN** manager saves changes
- **THEN** product updates with new currency and cost fields
