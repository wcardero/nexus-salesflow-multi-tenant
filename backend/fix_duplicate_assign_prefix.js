const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      UPDATE "Sale"
      SET "inventoryItemId" = REPLACE("inventoryItemId", 'assign-assign-', 'assign-')
      WHERE "inventoryItemId" LIKE 'assign-assign-%'
      RETURNING id, "inventoryItemId", "finalMN"
    `);
    
    console.log(`Ventas actualizadas (${result.rows.length} registros):`);
    result.rows.forEach(row => {
      console.log(`- ID: ${row.id}, inventoryItemId: ${row.inventoryItemId}, Final MN: ${row.finalMN}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
