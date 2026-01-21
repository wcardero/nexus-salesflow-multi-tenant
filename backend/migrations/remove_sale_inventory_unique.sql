-- Migration: Remove UNIQUE constraint from Sale.inventoryItemId
-- Date: 2026-01-21
-- Issue: Cannot sell multiple items from the same AssignedInventory

-- First, find the constraint name
-- The constraint is usually named like: Sale_inventoryItemId_key or similar

-- Drop the unique constraint (PostgreSQL doesn't have IF EXISTS for constraints)
ALTER TABLE "Sale" DROP CONSTRAINT IF EXISTS "Sale_inventoryItemId_key";

-- Drop the auto-created index if it exists
DROP INDEX IF EXISTS "Sale_inventoryItemId_key";
