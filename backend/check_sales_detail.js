const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT s.*, u.name as gestorName, p.name as productName, ai."productId", ai.id as "assignedInventoryId"
      FROM "Sale" s
      JOIN "User" u ON s."gestorId" = u.id
      JOIN "AssignedInventory" ai ON s."inventoryItemId" LIKE ai.id || '-%' OR ai.id = s."inventoryItemId"
      JOIN "Product" p ON ai."productId" = p.id
      WHERE u.name = 'lolo'
      ORDER BY s."soldAt" DESC
      LIMIT 10
    `);
    
    console.log(`Ventas recientes de lolo (${result.rows.length} registros):`);
    result.rows.forEach(row => {
      console.log(`\n- ID: ${row.id}`);
      console.log(`- Producto: ${row.productname || 'N/A'}`);
      console.log(`- inventoryItemId: ${row.inventoryitemid}`);
      console.log(`- assignedInventoryId: ${row.assignedInventoryId || 'N/A'}`);
      console.log(`- Final MN: ${row.finalmn}`);
      console.log(`- Fecha: ${row.soldAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
