# Spec: Unique Product Name Validation by Manager

## Overview
Each manager can only have one product with a given name. This prevents accidental duplicates within a manager's product catalog while allowing different managers to create products with the same name (since they may sell similar items independently). The validation is done at the database level and enforced by the API.

## Business Rules
1. A manager cannot create two products with the same name
2. A manager cannot edit a product to have the same name as another product they already have
3. Different managers can create products with the same name (no cross-manager restriction)
4. Directors are also subject to this constraint when creating products

## Requirements

### 1. Database Schema
**Location**: `backend/src/init-db.ts`

**Requirements:**
- Add `createdBy` column to `Product` table
- Type: TEXT
- Nullable: YES (for backward compatibility with existing products)
- This field stores the User ID of the manager/director who created the product

```sql
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "costUSD" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "commissionRate" DOUBLE PRECISION,
    "storeId" TEXT NOT NULL,
    "createdBy" TEXT,
    CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
```

### 2. Create Product Validation
**Location**: `backend/src/index.ts` - POST /api/products

**Requirements:**
- Before inserting a new product, check if a product with the same name exists for the same `createdBy` value
- The check query:
  ```sql
  SELECT id FROM "Product" WHERE name = $1 AND "createdBy" = $2
  ```
- If any row is returned, return HTTP 409 (Conflict)
- Error message: "Ya tienes un producto con ese nombre. No puedes crear dos productos con el mismo nombre."
- Include `createdBy` in the INSERT statement with value from authenticated user

```typescript
const existingProduct = await db.query(
  'SELECT id FROM "Product" WHERE name = $1 AND "createdBy" = $2',
  [name, requestingUser.id]
);

if (existingProduct.rows.length > 0) {
  return res.status(409).json({ message: 'Ya tienes un producto con ese nombre. No puedes crear dos productos con el mismo nombre.' });
}

const productId = 'prod-' + Date.now();
const result = await db.query(
  'INSERT INTO "Product" (id, name, "costUSD", margin, "commissionRate", "storeId", "createdBy") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
  [productId, name, parseFloat(costUSD), parseFloat(margin), commissionRate ? parseFloat(commissionRate) : null, finalStoreId, requestingUser.id]
);
```

### 3. Update Product Validation
**Location**: `backend/src/index.ts` - PUT /api/products/:id

**Requirements:**
- Only validate when the `name` field is being changed
- Check if the new name already exists for the same `createdBy` user
- Exclude the current product ID from the check (a product can keep its own name)
- Return HTTP 409 (Conflict) if duplicate found
- Error message: "Ya tienes un producto con ese nombre."

```typescript
if (name !== undefined && name !== product.name) {
  const duplicateCheck = await db.query(
    'SELECT id FROM "Product" WHERE name = $1 AND "createdBy" = $2 AND id != $3',
    [name, requestingUser.id, id]
  );
  if (duplicateCheck.rows.length > 0) {
    return res.status(409).json({ message: 'Ya tienes un producto con ese nombre.' });
  }
}
```

### 4. TypeScript Types
**Location**: `types.ts`

**Requirements:**
- Add `createdBy` field to `Product` interface
- Mark as optional (`?`) to maintain backward compatibility

```typescript
export interface Product {
  id: string;
  storeId: string;
  name: string;
  costUSD: number;
  margin: number;
  commissionRate?: number;
  createdBy?: string; // ID del usuario que creó el producto
}
```

## User Flows

### Flow 1: Create Product - Unique Name
1. Manager logs into system
2. Manager navigates to "Productos" tab
3. Manager enters product details with name "Camisa Azul"
4. Manager clicks "Agregar Producto"
5. Backend validates: No other product with name "Camisa Azul" exists for this manager
6. Product is created successfully
7. Success message shown: "Producto creado exitosamente."

### Flow 2: Create Product - Duplicate Name (Same Manager)
1. Manager already has a product named "Camisa Azul"
2. Manager tries to create another product named "Camisa Azul"
3. Manager clicks "Agregar Producto"
4. Backend validates: Product with name "Camisa Azul" already exists for this manager
5. Request rejected with HTTP 409
6. Error alert shown: "Ya tienes un producto con ese nombre. No puedes crear dos productos con el mismo nombre."
7. Product is NOT created

### Flow 3: Create Product - Same Name (Different Manager)
1. Manager A has a product named "Camisa Azul"
2. Manager B logs into system (different store, same or different company)
3. Manager B creates a product named "Camisa Azul"
4. Backend validates: No product with name "Camisa Azul" exists for Manager B
5. Product is created successfully for Manager B
6. Both Manager A and Manager B have their own "Camisa Azul" product

### Flow 4: Edit Product - Change to Unique Name
1. Manager has product "Pantalón Rojo" and wants to rename to "Pantalón Azul"
2. Manager clicks "Editar" on "Pantalón Rojo"
3. Manager changes name to "Pantalón Azul"
4. Manager clicks "Guardar Cambios"
5. Backend validates: No product with name "Pantalón Azul" exists for this manager
6. Product name is updated successfully
7. Success message shown: "Producto actualizado exitosamente."

### Flow 5: Edit Product - Change to Duplicate Name
1. Manager has two products: "Pantalón Rojo" and "Pantalón Azul"
2. Manager clicks "Editar" on "Pantalón Rojo"
3. Manager changes name to "Pantalón Azul"
4. Manager clicks "Guardar Cambios"
5. Backend validates: Product with name "Pantalón Azul" already exists for this manager
6. Request rejected with HTTP 409
7. Error alert shown: "Ya tienes un producto con ese nombre."
8. Product name is NOT changed

### Flow 6: Director Creating Product
1. Director logs into system
2. Director creates product named "Zapatos Negros"
3. Director's ID is stored as `createdBy`
4. Director tries to create another product named "Zapatos Negros"
5. Backend validates: Product with name "Zapatos Negros" already exists for this Director
6. Request rejected with HTTP 409
7. Error alert shown

## Acceptance Criteria
- [ ] Product table has `createdBy` column
- [ ] `createdBy` field is nullable
- [ ] `Product` type includes `createdBy?: string`
- [ ] Creating a product with duplicate name returns HTTP 409
- [ ] Creating a product with unique name succeeds
- [ ] `createdBy` is populated when creating a product
- [ ] Error message for duplicate creation: "Ya tienes un producto con ese nombre. No puedes crear dos productos con el mismo nombre."
- [ ] Editing product name to duplicate returns HTTP 409
- [ ] Editing product name to unique value succeeds
- [ ] Error message for duplicate edit: "Ya tienes un producto con ese nombre."
- [ ] Different managers can create products with same name
- [ ] Directors are also subject to unique name constraint
- [ ] Existing products (before this feature) work correctly (createdBy is null)

## Edge Cases
- Product created before this feature (createdBy is null) - Should not block new products
- Manager leaves the company (deleted user) - createdBy points to non-existent user, but validation still works
- Same user creates products in different stores - Still unique per user, not per store
- Empty or whitespace-only names - Handled by existing validation
- Case sensitivity - Names are compared exactly (case-sensitive)

## Performance Considerations
- Add database index on (name, createdBy) for efficient duplicate checking:
  ```sql
  CREATE INDEX "product_name_creator_idx" ON "Product" (name, "createdBy");
  ```

## Security Considerations
- Validation is done on the server, not in the frontend
- Frontend cannot bypass the validation
- User ID is taken from authenticated token, not from request body

## Backward Compatibility
- Existing products without `createdBy` will have NULL value
- New validation only applies when `createdBy` is NOT NULL
- Future products will always have `createdBy` populated
- Existing functionality (edit, delete, list) continues to work
