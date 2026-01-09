const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM "Sale"
      WHERE "gestorId" = (
        SELECT id FROM "User" WHERE name = 'lolo'
      )
      ORDER BY "soldAt" DESC
      LIMIT 10
    `);
    
    console.log(`Ventas recientes de lolo (${result.rows.length} registros):`);
    result.rows.forEach(row => {
      console.log(`\n- ID: ${row.id}`);
      console.log(`- inventoryItemId: ${row.inventoryitemid}`);
      console.log(`- gestorId: ${row.gestorid}`);
      console.log(`- Final MN: ${row.finalmn}`);
      console.log(`- Base MN: ${row.basemn}`);
      console.log(`- Fecha: ${row.soldAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
