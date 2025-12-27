const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'AssignedInventory' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Columnas de AssignedInventory:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
