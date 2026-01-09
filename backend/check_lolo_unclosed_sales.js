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
      AND s.id NOT IN (SELECT "B" FROM "_ClosingToSale")
      ORDER BY s."soldAt" DESC
    `);
    
    console.log(`Ventas de lolo NO vinculadas a cierres (${result.rows.length} registros):`);
    result.rows.forEach(row => {
      console.log(`- ID: ${row.id}, Final MN: ${row.finalMN}, Fecha: ${row.soldAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
