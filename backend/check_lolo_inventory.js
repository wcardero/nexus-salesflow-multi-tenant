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
      console.log(`- ID: ${row.id}, Producto: ${row.productname}, Cantidad: ${row.quantity}, Status: ${row.status}, priceMN: ${row.priceMN}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
