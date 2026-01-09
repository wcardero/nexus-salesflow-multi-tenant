const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT s.id, s."inventoryItemId", s."finalMN", s."soldAt", p.name as "productName", ai.id as "assignedInventoryId"
      FROM "Sale" s
      JOIN "AssignedInventory" ai ON s."inventoryItemId" LIKE 'assign-' || ai.id || '-%'
      JOIN "Product" p ON ai."productId" = p.id
      WHERE s."gestorId" = (
        SELECT id FROM "User" WHERE name = 'lolo'
      )
      ORDER BY s."soldAt" DESC
      LIMIT 10
    `);
    
    console.log(`Ventas recientes de lolo (${result.rows.length} registros):`);
    result.rows.forEach(row => {
      console.log(`\n- ID: ${row.id}`);
      console.log(`- Producto: ${row.productName}`);
      console.log(`- inventoryItemId: ${row.inventoryItemId}`);
      console.log(`- Final MN: ${row.finalMN}`);
      console.log(`- Fecha: ${row.soldAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
