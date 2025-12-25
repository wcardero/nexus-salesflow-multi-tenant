# Spec: Product-Specific Commission Rate for Manager

## Overview
Managers should be able to set custom commission rates for specific products, giving them flexibility to adjust commission structures based on product margins, promotions, or business needs. When no specific commission is set for a product, it uses the store's default commission rate.

## Requirements

### 1. Product Type Extension
**Location**: `types.ts`
- Add optional `commissionRate` field to `Product` interface
- Type: `number | undefined` (decimal value, e.g., 0.10 for 10%)
- When undefined, the store's default commission rate is used

### 2. Commission Rate Determination Logic
**Location**: `utils.ts`
- Create `getCommissionRateForProduct(product, store)` helper function
- Logic:
  - If product has `commissionRate` defined → use product's commission rate
  - If product has no `commissionRate` → use store's `defaultCommissionRate`
- This function will be used wherever product pricing is calculated

### 3. Product Creation Form Enhancement
**Location**: `views/ManagerDashboard.tsx` - ProductsView
- Add commission input field to product creation form
- Form now has 5 fields instead of 4:
  1. Name
  2. Cost (USD)
  3. Margin (%)
  4. **Commission (%)** - NEW
  5. Submit button
- Commission field behavior:
  - Optional (can be left empty)
  - Placeholder shows store's default commission rate (e.g., "Comisión % (def: 10%)")
  - Type: number, min: 0, max: 100, step: 0.1
  - When empty → product uses store default commission
  - When filled → product uses specified commission

### 4. Product List Display
**Location**: `views/ManagerDashboard.tsx` - ProductsView
- Display commission rate for each product in the list
- Format: "X% (específica)" or "X% (por defecto)"
- Show alongside other product info (cost, margin)
- Use color coding to differentiate:
  - Specific commission: distinctive color (e.g., purple or teal)
  - Default commission: standard text color

### 5. Price Calculation Integration
**Location**: `views/ManagerDashboard.tsx` - ProductsView
- When calculating displayed prices, use `getCommissionRateForProduct()` to determine which commission to apply
- This ensures the displayed final price reflects the correct commission rate

## Implementation Details

### Modified Types (types.ts)

```typescript
export interface Product {
  id: string;
  storeId: string;
  name: string;
  costUSD: number;
  margin: number;
  commissionRate?: number; // NEW: Optional commission rate for this product
}
```

### New Utility Function (utils.ts)

```typescript
export const getCommissionRateForProduct = (product: Product, store: Store): number => {
  // Use product-specific commission if defined, otherwise fall back to store default
  if (product.commissionRate !== undefined && product.commissionRate !== null) {
    return product.commissionRate;
  }
  return store.defaultCommissionRate;
};
```

### Product Creation Form Update (ManagerDashboard.tsx)

```typescript
const [commission, setCommission] = useState('');

<form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6 items-end">
  <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" />
  <input value={cost} onChange={e => setCost(e.target.value)} placeholder="Costo (USD)" type="number" />
  <input value={margin} onChange={e => setMargin(e.target.value)} placeholder="Margen (%)" type="number" />
  <input
    value={commission}
    onChange={e => setCommission(e.target.value)}
    placeholder={`Comisión % (def: ${(store.defaultCommissionRate * 100).toFixed(0)}%)`}
    type="number"
    min="0"
    max="100"
    step="0.1"
  />
  <button type="submit">Agregar Producto</button>
</form>

const handleAdd = (e: React.FormEvent) => {
  // ... validation ...
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name,
    costUSD: parseFloat(cost),
    margin: parseFloat(margin) / 100,
    commissionRate: commission.trim() ? parseFloat(commission) / 100 : undefined, // NEW
    storeId: store.id
  };
  // ... add to db ...
};
```

### Product List Display Update (ManagerDashboard.tsx)

```typescript
{storeProducts.map(p => {
  const productCommissionRate = getCommissionRateForProduct(p, store);
  const prices = calculateProductPrices(p, currentExchangeRate, productCommissionRate);

  // Determine commission label
  const commissionLabel = p.commissionRate !== undefined
    ? `${(p.commissionRate * 100).toFixed(1)}% (específica)`
    : `${(store.defaultCommissionRate * 100).toFixed(1)}% (por defecto)`;

  return (
    <li>
      <div className="text-sm text-slate-500">
        Costo: ${p.costUSD} | Margen: {(p.margin*100).toFixed(1)}% |
        <span className={p.commissionRate !== undefined ? 'text-purple-600' : ''}>
          Comisión: {commissionLabel}
        </span>
      </div>
      <div>Precio: {formatCurrency(prices.finalMN)}</div>
    </li>
  );
})}
```

## User Flows

### Flow 1: Create Product with Default Commission
1. Manager logs in and navigates to "Productos" tab
2. Manager fills in: Name, Cost, Margin
3. Manager leaves Commission field empty
4. Manager clicks "Agregar Producto"
5. Product is created without commissionRate field
6. In product list, displays: "Comisión: 10% (por defecto)"
7. Price is calculated using store's default commission (10%)

### Flow 2: Create Product with Specific Commission
1. Manager logs in and navigates to "Productos" tab
2. Manager fills in: Name, Cost, Margin
3. Manager enters "15" in Commission field
4. Manager clicks "Agregar Producto"
5. Product is created with commissionRate = 0.15
6. In product list, displays: "Comisión: 15.0% (específica)"
7. Price is calculated using product's specific commission (15%)

### Flow 3: Viewing Multiple Products with Different Commissions
1. Product A: No commission specified → uses 10% store default
2. Product B: Commission 5% → uses 5% specific commission
3. Product C: Commission 20% → uses 20% specific commission
4. All three display correctly with appropriate labels
5. Final prices reflect correct commission amounts

## Acceptance Criteria
- [ ] Product type has optional `commissionRate` field
- [ ] Product creation form has commission input field
- [ ] Commission field shows store default rate in placeholder
- [ ] Commission field can be left empty (uses default)
- [ ] Commission field accepts decimal values (e.g., 12.5%)
- [ ] Product can be created with specific commission
- [ ] Product can be created without commission (uses default)
- [ ] Product list shows commission rate for each product
- [ ] Commission label indicates "específica" or "por defecto"
- [ ] Price calculation uses correct commission rate
- [ ] Multiple products can have different commission rates
- [ ] `getCommissionRateForProduct` function works correctly

## Edge Cases
- Commission rate > 100% (should be prevented by max attribute)
- Negative commission rate (should be prevented by min attribute)
- Commission rate = 0% (allowed for promotional products)
- Store changes default commission rate after products are created (existing products keep their specific rates, default products use new rate)
- Product created without commission, then commission is added later (requires edit functionality - future enhancement)

## Backward Compatibility
- Existing products without `commissionRate` field continue to work (use store default)
- No migration needed - field is optional
- All existing functionality remains unchanged
