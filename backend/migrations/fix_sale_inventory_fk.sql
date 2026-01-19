ALTER TABLE "Sale" DROP CONSTRAINT IF EXISTS "Sale_inventoryItemId_fkey";
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "AssignedInventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
