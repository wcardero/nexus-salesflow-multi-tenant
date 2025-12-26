# Tasks: Add Unique Product Name Validation by Manager

## Database Migration
- [x] Add `createdBy` column to `Product` table
  - Column type: TEXT
  - Optional field (nullable for existing products)
  - Run migration script
- [x] Add index for efficient duplicate name checking
  - Index on (name, createdBy)
  - Run migration script

## Backend Changes
- [x] Update `POST /api/products` endpoint
  - Add validation to check if product with same name exists for the same manager (createdBy)
  - Include `createdBy` field in INSERT statement
  - Return 409 conflict error if duplicate name found
  - Error message: "Ya tienes un producto con ese nombre. No puedes crear dos productos con el mismo nombre."

- [x] Update `PUT /api/products/:id` endpoint
  - Add validation when product name is being changed
  - Check if new name already exists for same manager (excluding current product)
  - Return 409 conflict error if duplicate name found
  - Error message: "Ya tienes un producto con ese nombre."

## Frontend Changes
- [x] Update `types.ts`
  - Add `createdBy?: string` field to `Product` interface
  - Mark as optional to maintain backward compatibility

## Documentation
- [x] Create OpenSpec proposal.md
- [x] Create OpenSpec spec.md
- [x] Update conductor/product.md with business rules
- [ ] Update project.md if needed

## Testing
- [ ] Test creating product with duplicate name (should fail with appropriate error)
- [ ] Test creating product with unique name (should succeed)
- [ ] Test editing product name to duplicate (should fail)
- [ ] Test editing product name to unique name (should succeed)
- [ ] Test different managers creating products with same name (should succeed)
