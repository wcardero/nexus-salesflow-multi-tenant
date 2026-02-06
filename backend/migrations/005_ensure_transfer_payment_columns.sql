-- Migration 005: Ensure Transfer Payment Columns Exist
-- Description: Adds payment method and transfer surcharge columns if they don't exist
-- Safe for: Production (fully idempotent with IF NOT EXISTS)

-- 1. Create PaymentMethod enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMethod') THEN
    CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'CREDIT');
  END IF;
END $$;

-- 2. Add columns to Sale table if they don't exist
DO $$
BEGIN
  -- Add paymentMethod column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Sale' AND column_name = 'paymentMethod') THEN
    ALTER TABLE "Sale" ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH';
  END IF;

  -- Add transferSurchargePercent column  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Sale' AND column_name = 'transferSurchargePercent') THEN
    ALTER TABLE "Sale" ADD COLUMN "transferSurchargePercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
  END IF;

  -- Add transferSurchargeAmount column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Sale' AND column_name = 'transferSurchargeAmount') THEN
    ALTER TABLE "Sale" ADD COLUMN "transferSurchargeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 3. Backfill existing rows with default values (just in case)
UPDATE "Sale" 
SET "paymentMethod" = 'CASH',
    "transferSurchargePercent" = 0,
    "transferSurchargeAmount" = 0
WHERE "paymentMethod" IS NULL;
