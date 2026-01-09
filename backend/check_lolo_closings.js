const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT c.id, c."gestorId", c.status, c."totalFinalMN", c.sales
      FROM "Closing" c
      WHERE c."gestorId" = (SELECT id FROM "User" WHERE name = 'lolo')
      ORDER BY c."initiatedAt" DESC
      LIMIT 5
    `);
    
    console.log(`Cierres de lolo (${result.rows.length} registros):`);
    result.rows.forEach(row => {
      console.log(`\n- ID: ${row.id}`);
      console.log(`- Status: ${row.status}`);
      console.log(`- Total Final: ${row.totalFinalMN}`);
      console.log(`- Sales: ${JSON.stringify(row.sales || 'N/A')}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
