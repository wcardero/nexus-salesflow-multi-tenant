# Spec: Exchange Rate Validation and Display for Manager

## Overview
Managers must verify that an exchange rate exists before creating products, as the final product price depends on it. The system should display the current exchange rate prominently and show calculated prices in the product list.

## Requirements

### 1. Exchange Rate Display in Header
**Location**: `components/Layout.tsx`
- Display current exchange rate in the sidebar header for all roles (Manager, Gestor)
- Show with a badge style when exchange rate is available
- Icon: `currency_exchange`
- Format: `TC: {rate}`

### 2. Product Creation Validation
**Location**: `views/ManagerDashboard.tsx` - ProductsView
- Check if a valid exchange rate exists before allowing product creation
- If no exchange rate exists:
  - Show warning message: "⚠️ No hay un tipo de cambio vigente. Configure uno en la pestaña 'Tipo de Cambio'."
  - Disable the "Agregar Producto" button
  - Display with amber/warning styling

### 3. Product List with Calculated Prices
**Location**: `views/ManagerDashboard.tsx` - ProductsView
- Display calculated final price for each product in the list
- Use existing utilities: `calculateProductPrices(product, exchangeRate, commissionRate)`
- Price breakdown display:
  - Product name (bold)
  - Cost and margin info
  - Final price with `formatCurrency()` (prominent, sky blue color)

### 4. Utility Functions
**Location**: `utils.ts` (already exists, no changes needed)
- `getCurrentExchangeRate(store)` - Get current active exchange rate
- `calculateProductPrices(product, exchangeRate, commissionRate)` - Calculate all prices

## Implementation Details

### Modified Components

#### Layout.tsx
```typescript
// Add imports
import { Store } from '../types';
import { getCurrentExchangeRate } from '../utils';

// Add store prop to interface
interface LayoutProps {
  store?: Store;  // NEW
  // ... other props
}

// Calculate current exchange rate
const currentExchangeRate = store ? getCurrentExchangeRate(store) : null;

// Display in header
{currentExchangeRate && (
  <div className="mt-1 px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-md inline-flex items-center gap-1">
    <span className="material-symbols-outlined text-sm">currency_exchange</span>
    <span>TC: {currentExchangeRate.rate}</span>
  </div>
)}
```

#### App.tsx
```typescript
// Pass store prop to Layout
<Layout
  store={activeStore}  // NEW
  // ... other props
/>
```

#### ManagerDashboard.tsx - ProductsView
```typescript
// Add imports
import { getCurrentExchangeRate, calculateProductPrices } from '../utils';

// Get current exchange rate
const currentExchangeRate = getCurrentExchangeRate(store);

// Validation in handleAdd
if (!currentExchangeRate) {
  alert('No hay un tipo de cambio vigente. Por favor, configure un tipo de cambio antes de agregar productos.');
  return;
}

// Disable button if no exchange rate
<button
  type="submit"
  disabled={!currentExchangeRate}
  className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed ..."
>
  Agregar Producto
</button>

// Display calculated price in list
{storeProducts.map(p => {
  const prices = calculateProductPrices(p, currentExchangeRate, store.defaultCommissionRate);
  return (
    <li>
      {p.name}
      {currentExchangeRate && (
        <div className="text-base font-bold text-sky-600">
          Precio: {formatCurrency(prices.finalMN)}
        </div>
      )}
    </li>
  );
})}
```

## User Flow

### Flow 1: Manager with No Exchange Rate Configured
1. Manager logs in
2. Manager navigates to "Productos" tab
3. Warning message displayed: "⚠️ No hay un tipo de cambio vigente"
4. "Agregar Producto" button is disabled
5. Manager must navigate to "Tipo de Cambio" tab to configure rate
6. After configuring rate, product creation becomes available

### Flow 2: Manager with Exchange Rate Configured
1. Manager logs in
2. Exchange rate displayed in header (e.g., "TC: 300")
3. Manager navigates to "Productos" tab
4. Product list shows calculated prices (e.g., "Precio: $9,000 ARS")
5. Manager can create new products
6. New products display correct calculated prices

## Acceptance Criteria
- [ ] Exchange rate displays in header for Manager role when configured
- [ ] Exchange rate displays in header for Gestor role when configured
- [ ] Product creation is blocked when no exchange rate exists
- [ ] Warning message is visible when no exchange rate exists
- [ ] "Agregar Producto" button is disabled when no exchange rate exists
- [ ] Product list displays calculated final prices
- [ ] Calculated prices use correct exchange rate and commission
- [ ] Prices update when exchange rate changes

## Edge Cases
- No exchange rates configured at all
- Multiple exchange rates (should use current based on date)
- Exchange rate changed while viewing products (should reflect immediately)
- Store with default commission rate 0%
