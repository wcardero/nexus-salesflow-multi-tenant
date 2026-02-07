-- Migration: Add Transfer Payment Support
-- Description: Adds payment method and transfer surcharge columns to Sale table
-- Date: 2025-02-06
-- Safe for: Production (uses ALTER TABLE, preserves existing data)

-- 1. Create PaymentMethod enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMethod') THEN
    CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'CREDIT');
  END IF;
END $$;

-- 2. Add new columns to Sale table (if they don't exist)
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

-- 3. Backfill existing data (optional - sets default values)
-- All existing sales will have paymentMethod = 'CASH' and surcharge = 0

-- 4. Verification query
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'Sale' 
  AND column_name IN ('paymentMethod', 'transferSurchargePercent', 'transferSurchargeAmount')
ORDER BY column_name;
