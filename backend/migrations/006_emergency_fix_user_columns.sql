-- Emergency Migration: Fix missing columns in production
-- This migration adds missing columns that were not created in the initial production setup

-- 1. Create Role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role" AS ENUM ('Admin', 'Director', 'Manager', 'Gestor');
  END IF;
END $$;

-- 2. Add missing columns to User table
DO $$
BEGIN
  -- Add role column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'User' AND column_name = 'role') THEN
    ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'Gestor';
  END IF;

  -- Add createdBy column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'User' AND column_name = 'createdBy') THEN
    ALTER TABLE "User" ADD COLUMN "createdBy" TEXT;
    
    -- Add foreign key constraint
    ALTER TABLE "User" 
    ADD CONSTRAINT "User_createdBy_fkey" 
    FOREIGN KEY ("createdBy") REFERENCES "User"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 3. Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' 
ORDER BY ordinal_position;
