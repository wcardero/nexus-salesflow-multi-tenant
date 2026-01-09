const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT ai.*, p.name as productName, u.name as gestorName
      FROM "AssignedInventory" ai
      JOIN "Product" p ON ai."productId" = p.id
      JOIN "User" u ON ai."gestorId" = u.id
      WHERE u.name = 'lolo'
    `);
    
    console.log(`Inventario asignado a lolo (${result.rows.length} registros):`);
    result.rows.forEach(row => {
      console.log(`\n- ID: ${row.id}`);
      console.log(`- Producto: ${row.productname}`);
      console.log(`- Cantidad: ${row.quantity}`);
      console.log(`- Status: ${row.status}`);
      console.log(`- priceMN: ${row.priceMN}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
