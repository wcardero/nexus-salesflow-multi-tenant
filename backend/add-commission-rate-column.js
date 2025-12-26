const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addCommissionRateColumn() {
  try {
    console.log('Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('Connected to database!');

    console.log('Adding commissionRate column to Product table...');
    await pool.query(`
      ALTER TABLE "Product"
      ADD COLUMN IF NOT EXISTS "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.10
    `);
    console.log('Column added successfully!');

    await pool.end();
    console.log('Migration completed.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    await pool.end();
    process.exit(1);
  }
}

addCommissionRateColumn();
