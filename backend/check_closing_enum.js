const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT u.typname as type, e.enumlabel as label
      FROM pg_enum e
      JOIN pg_type u ON e.enumtypid = u.oid
      WHERE u.typname = 'ClosingStatus'
      ORDER BY e.enumsortorder
    `);
    
    console.log('Valores del enum ClosingStatus:');
    result.rows.forEach(row => {
      console.log(`- ${row.label}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
