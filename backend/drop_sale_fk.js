const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    // Eliminar foreign key de inventoryItemId que referencia a InventoryItem
    await client.query(`
      ALTER TABLE "Sale" DROP CONSTRAINT IF EXISTS "Sale_inventoryItemId_fkey"
    `);
    console.log('✓ Foreign key Sale_inventoryItemId_fkey eliminada');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
