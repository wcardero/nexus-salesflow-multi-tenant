const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function alterCommissionRateColumn() {
  try {
    console.log('Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('Connected to database!');

    console.log('Altering commissionRate column to be nullable...');
    await pool.query(`
      ALTER TABLE "Product"
      ALTER COLUMN "commissionRate" DROP NOT NULL
    `);
    console.log('Column altered successfully!');

    await pool.end();
    console.log('Migration completed.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    await pool.end();
    process.exit(1);
  }
}

alterCommissionRateColumn();
