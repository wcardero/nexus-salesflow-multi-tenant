const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    // Check the column definition
    const result = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'AssignedInventory'
      AND column_name = 'status'
    `);

    if (result.rows.length === 0) {
      console.log('La columna status NO existe en AssignedInventory');
    } else {
      console.log('Columna status:', result.rows[0]);
    }

    // Show all columns
    const columns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'AssignedInventory'
      ORDER BY ordinal_position
    `);
    console.log('\nTodas las columnas de AssignedInventory:');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (default: ${col.column_default})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
