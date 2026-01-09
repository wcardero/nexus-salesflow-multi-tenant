const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT id, "inventoryItemId", "gestorId", "soldAt", "finalMN", "baseMN" FROM "Sale"
      WHERE "gestorId" = (
        SELECT id FROM "User" WHERE name = 'lolo'
      )
      ORDER BY "soldAt" DESC
      LIMIT 10
    `);
    
    console.log(`Ventas recientes de lolo (${result.rows.length} registros):`);
    result.rows.forEach(row => {
      console.log(`\n- ID: ${row.id}`);
      console.log(`- inventoryItemId: ${row.inventoryItemId}`);
      console.log(`- gestorId: ${row.gestorId}`);
      console.log(`- Final MN: ${row.finalMN}`);
      console.log(`- Base MN: ${row.baseMN}`);
      console.log(`- Fecha: ${row.soldAt}`);
    });

    console.log(`\nTotal finalMN: ${result.rows.reduce((sum, r) => sum + (r.finalMN || 0), 0)}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
