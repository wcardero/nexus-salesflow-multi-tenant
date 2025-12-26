# Change: Add Unique Product Name Validation by Manager

## Why
Previously, products with the same name could be created by the same manager, leading to confusion and duplicate entries in the product list. This change ensures that each manager can only have one product with a given name, while allowing different managers to create products with the same name. This prevents accidental duplicates while maintaining flexibility across different managers.

## What Changes
- Add `createdBy` column to `Product` table to track which manager created each product
- Validate product name uniqueness per manager when creating a new product
- Validate product name uniqueness per manager when editing a product (when changing the name)
- Update error messages to be more specific: "Ya tienes un producto con ese nombre."
- Update `Product` type to include `createdBy` field
- Database migration to add `createdBy` column

## Impact
- Affected specs: manager
- Affected code:
  - backend/src/index.ts - POST /api/products validation
  - backend/src/index.ts - PUT /api/products/:id validation
  - backend/src/init-db.ts - Product table schema
  - types.ts - Product interface
  - Database: Add createdBy column to Product table

## Error Messages
- Creating duplicate name: "Ya tienes un producto con ese nombre. No puedes crear dos productos con el mismo nombre."
- Editing to duplicate name: "Ya tienes un producto con ese nombre."
