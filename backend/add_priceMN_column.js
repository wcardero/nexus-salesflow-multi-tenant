const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    // Verificar columnas actuales
    const columns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'AssignedInventory'
      ORDER BY ordinal_position
    `);
    console.log('Columnas actuales de AssignedInventory:');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });

    // Agregar columna priceMN
    await client.query(`
      ALTER TABLE "AssignedInventory"
      ADD COLUMN IF NOT EXISTS "priceMN" DOUBLE PRECISION
    `);
    console.log('\n✓ Columna priceMN agregada');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
