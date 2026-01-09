const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT c.id, c."gestorId", c.status, c."totalFinalMN", c."initiatedAt",
             COALESCE(json_agg(
               json_build_object(
                 'id', s.id,
                 'finalMN', s."finalMN",
                 'baseMN', s."baseMN",
                 'commission', s.commission
               )
             ) FILTER (WHERE s.id IS NOT NULL), '[]') AS sales
      FROM "Closing" c
      LEFT JOIN "_ClosingToSale" c2s ON c.id = c2s."A"
      LEFT JOIN "Sale" s ON c2s."B" = s.id
      WHERE c."gestorId" = (SELECT id FROM "User" WHERE name = 'lolo')
      GROUP BY c.id
      ORDER BY c."initiatedAt" DESC
      LIMIT 5
    `);
    
    console.log(`Cierres de lolo (${result.rows.length} registros):`);
    result.rows.forEach(row => {
      console.log(`\n- ID: ${row.id}`);
      console.log(`- Status: ${row.status}`);
      console.log(`- Total Final: ${row.totalFinalMN}`);
      console.log(`- Sales (${row.sales.length}): ${JSON.stringify(row.sales.map(s => s.id))}`);
    });

    const totalSales = result.rows.reduce((sum, closing) => sum + closing.sales.length, 0);
    console.log(`\nTotal ventas en cierres: ${totalSales}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
