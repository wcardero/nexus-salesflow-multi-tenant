-- Add directorId column to Store table
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "directorId" TEXT;
ALTER TABLE "Store" ADD CONSTRAINT "Store_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
