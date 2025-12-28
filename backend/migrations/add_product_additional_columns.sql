-- Migración para agregar columnas faltantes a la tabla Product
ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "createdBy" TEXT,
ADD COLUMN IF NOT EXISTS "priceMN" REAL,
ADD COLUMN IF NOT EXISTS "gestorCommissionMN" REAL;
