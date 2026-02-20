-- Migration 009: Ensure ALL Missing Columns Exist
-- Description: Adds any columns that might be missing from Sale and Closing tables
-- This is a "catch-all" migration to fix production issues
-- Date: 2026-02-20
-- Safe for: Production (fully idempotent with IF NOT EXISTS)

-- 1. Create required ENUMs if they don't exist
DO $$ 
BEGIN
  -- ClosingStatus enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ClosingStatus') THEN
    CREATE TYPE "ClosingStatus" AS ENUM ('PENDING', 'COMPLETED');
    RAISE NOTICE 'Created ClosingStatus enum';
  END IF;

  -- SalePaymentStatus enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SalePaymentStatus') THEN
    CREATE TYPE "SalePaymentStatus" AS ENUM ('PAID', 'PENDING');
    RAISE NOTICE 'Created SalePaymentStatus enum';
  END IF;

  -- PaymentMethod enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMethod') THEN
    CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'CREDIT');
    RAISE NOTICE 'Created PaymentMethod enum';
  END IF;
END $$;

-- 2. Add columns to Sale table
DO $$
BEGIN
  -- paymentStatus column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Sale' AND column_name = 'paymentStatus') THEN
    ALTER TABLE "Sale" ADD COLUMN "paymentStatus" "SalePaymentStatus" NOT NULL DEFAULT 'PAID';
    RAISE NOTICE 'Added paymentStatus to Sale table';
  END IF;

  -- paymentMethod column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Sale' AND column_name = 'paymentMethod') THEN
    ALTER TABLE "Sale" ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH';
    RAISE NOTICE 'Added paymentMethod to Sale table';
  END IF;

  -- transferSurchargePercent column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Sale' AND column_name = 'transferSurchargePercent') THEN
    ALTER TABLE "Sale" ADD COLUMN "transferSurchargePercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
    RAISE NOTICE 'Added transferSurchargePercent to Sale table';
  END IF;

  -- transferSurchargeAmount column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Sale' AND column_name = 'transferSurchargeAmount') THEN
    ALTER TABLE "Sale" ADD COLUMN "transferSurchargeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
    RAISE NOTICE 'Added transferSurchargeAmount to Sale table';
  END IF;

  -- customerName column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Sale' AND column_name = 'customerName') THEN
    ALTER TABLE "Sale" ADD COLUMN "customerName" TEXT;
    RAISE NOTICE 'Added customerName to Sale table';
  END IF;

  -- accountingDate column (from migration 008, but ensure it exists)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Sale' AND column_name = 'accountingDate') THEN
    ALTER TABLE "Sale" ADD COLUMN "accountingDate" DATE;
    RAISE NOTICE 'Added accountingDate to Sale table';
  END IF;
END $$;

-- 3. Add columns to Closing table
DO $$
BEGIN
  -- status column (CRITICAL - was missing!)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Closing' AND column_name = 'status') THEN
    ALTER TABLE "Closing" ADD COLUMN "status" "ClosingStatus" NOT NULL DEFAULT 'PENDING';
    RAISE NOTICE 'Added status to Closing table';
  END IF;

  -- accountingDate column (from migration 008, but ensure it exists)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Closing' AND column_name = 'accountingDate') THEN
    ALTER TABLE "Closing" ADD COLUMN "accountingDate" DATE;
    RAISE NOTICE 'Added accountingDate to Closing table';
  END IF;
END $$;

-- 4. Backfill accountingDate for existing records
UPDATE "Sale" SET "accountingDate" = ("soldAt" AT TIME ZONE 'UTC')::DATE
WHERE "accountingDate" IS NULL;

UPDATE "Closing" SET "accountingDate" = ("initiatedAt" AT TIME ZONE 'UTC')::DATE
WHERE "accountingDate" IS NULL;

-- 5. Verification
DO $$
DECLARE
  sale_payment_status_exists BOOLEAN;
  sale_payment_method_exists BOOLEAN;
  closing_status_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'Sale' AND column_name = 'paymentStatus')
  INTO sale_payment_status_exists;
  
  SELECT EXISTS(SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'Sale' AND column_name = 'paymentMethod')
  INTO sale_payment_method_exists;
  
  SELECT EXISTS(SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'Closing' AND column_name = 'status')
  INTO closing_status_exists;

  IF sale_payment_status_exists AND sale_payment_method_exists AND closing_status_exists THEN
    RAISE NOTICE 'Migration 009 completed successfully - all columns verified';
  ELSE
    RAISE EXCEPTION 'Migration 009 failed - some columns missing';
  END IF;
END $$;
