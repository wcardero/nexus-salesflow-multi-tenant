const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addIndex() {
  try {
    console.log('Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('Connected to database!');

    console.log('Creating index for product name + createdBy...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "product_name_creator_idx" ON "Product" (name, "createdBy")
    `);
    console.log('Index created successfully!');

    await pool.end();
    console.log('Migration completed.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    await pool.end();
    process.exit(1);
  }
}

addIndex();
