const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('Querying "Store" table...');
    const result = await client.query('SELECT * FROM "Store"');
    console.log('Stores found:', result.rows);
  } catch (error) {
    console.error('Error querying stores:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
