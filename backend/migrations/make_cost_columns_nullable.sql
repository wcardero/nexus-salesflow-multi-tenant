-- Make costUSD and costMN columns nullable in Product table
ALTER TABLE "Product" ALTER COLUMN "costUSD" DROP NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "margin" DROP NOT NULL;
