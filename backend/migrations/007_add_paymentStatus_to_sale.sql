-- Migration: Add paymentStatus column to Sale table
-- This column was missing from previous migrations

DO $$
BEGIN
    -- Check if column doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Sale' AND column_name = 'paymentStatus'
    ) THEN
        -- Add paymentStatus column
        ALTER TABLE "Sale" ADD COLUMN "paymentStatus" "SalePaymentStatus" NOT NULL DEFAULT 'PAID';
        
        RAISE NOTICE 'Column paymentStatus added to Sale table';
    ELSE
        RAISE NOTICE 'Column paymentStatus already exists in Sale table';
    END IF;
END $$;
