// Script to add missing columns to Product table
require('dotenv').config();
const Pool = require('pg').Pool;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting migration...');
    await client.query('BEGIN');

    console.log('Adding column createdBy...');
    await client.query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "createdBy" TEXT');

    console.log('Adding column costMN...');
    await client.query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "costMN" REAL');

    console.log('Adding column currency...');
    await client.query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "currency" TEXT');

    console.log('Adding column priceMN...');
    await client.query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "priceMN" REAL');

    console.log('Adding column gestorCommissionMN...');
    await client.query('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "gestorCommissionMN" REAL');

    console.log('Making costUSD nullable...');
    await client.query('ALTER TABLE "Product" ALTER COLUMN "costUSD" DROP NOT NULL');

    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
