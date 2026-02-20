-- Migration 008: Add accountingDate column to Sale and Closing tables
-- Description: Adds the accountingDate (DATE) column that tracks the business-local
--              date of a sale/closing, independent of server timezone.
-- Safe for: Production (fully idempotent with IF NOT EXISTS checks)

DO $$
BEGIN
    -- Add accountingDate to Sale table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Sale' AND column_name = 'accountingDate'
    ) THEN
        ALTER TABLE "Sale" ADD COLUMN "accountingDate" DATE;

        -- Backfill existing rows: use soldAt date as accountingDate
        UPDATE "Sale" SET "accountingDate" = ("soldAt" AT TIME ZONE 'UTC')::DATE
        WHERE "accountingDate" IS NULL;

        RAISE NOTICE 'Column accountingDate added to Sale table and backfilled';
    ELSE
        RAISE NOTICE 'Column accountingDate already exists in Sale table';
    END IF;

    -- Add accountingDate to Closing table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Closing' AND column_name = 'accountingDate'
    ) THEN
        ALTER TABLE "Closing" ADD COLUMN "accountingDate" DATE;

        -- Backfill existing rows: use initiatedAt date as accountingDate
        UPDATE "Closing" SET "accountingDate" = ("initiatedAt" AT TIME ZONE 'UTC')::DATE
        WHERE "accountingDate" IS NULL;

        RAISE NOTICE 'Column accountingDate added to Closing table and backfilled';
    ELSE
        RAISE NOTICE 'Column accountingDate already exists in Closing table';
    END IF;
END $$;
