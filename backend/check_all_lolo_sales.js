const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT s.id, s."finalMN", s."soldAt"
      FROM "Sale" s
      WHERE s."gestorId" = (SELECT id FROM "User" WHERE name = 'lolo')
      ORDER BY s."soldAt" DESC
      LIMIT 10
    `);
    
    console.log(`Todas las ventas de lolo (${result.rows.length} registros):`);
    result.rows.forEach(row => {
      console.log(`- ID: ${row.id}, Final MN: ${row.finalMN}, Fecha: ${row.soldAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
