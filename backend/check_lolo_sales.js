const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT s.*, u.name as gestorName, p.name as productName
      FROM "Sale" s
      JOIN "User" u ON s."gestorId" = u.id
      LEFT JOIN "InventoryItem" ii ON s."inventoryItemId" = ii.id
      LEFT JOIN "Product" p ON ii."productId" = p.id
      WHERE u.name = 'lolo'
      ORDER BY s."soldAt" DESC
      LIMIT 5
    `);
    
    console.log(`Ventas recientes de lolo (${result.rows.length} registros):`);
    result.rows.forEach(row => {
      console.log(`\n- ID: ${row.id}`);
      console.log(`- Producto: ${row.productname || 'N/A'}`);
      console.log(`- Costo USD: ${row.costusd}`);
      console.log(`- Margen: ${row.margin}`);
      console.log(`- Sale USD: ${row.saleusd}`);
      console.log(`- Tipo de cambio usado: ${row.exchangerateused}`);
      console.log(`- Base MN: ${row.basemn}`);
      console.log(`- Comisión: ${row.commission}`);
      console.log(`- Final MN: ${row.finalmn}`);
      console.log(`- Fecha: ${row.soldat}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
