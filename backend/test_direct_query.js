const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const managerId = 'user-1767049095398'; // juan
    
    const query = `
      SELECT c.*, COALESCE(
        (SELECT json_agg(json_build_object(
          'id', s.id,
          'inventoryItemId', s."inventoryItemId",
          'gestorId', s."gestorId",
          'soldAt', s."soldAt",
          'exchangeRateUsed', s."exchangeRateUsed",
          'costUSD', s."costUSD",
          'margin', s.margin,
          'saleUSD', s."saleUSD",
          'baseMN', s."baseMN",
          'commission', s.commission,
          'finalMN', s."finalMN"
        ) ORDER BY s.id)
       FROM "_ClosingToSale" c2s
       JOIN "Sale" s ON c2s."B" = s.id
       WHERE c2s."A" = c.id),
      '[]'
    ) AS sales
    FROM "Closing" c
    WHERE c."gestorId" IN (
      SELECT u.id FROM "User" u
      WHERE u."storeId" IN (
        SELECT stum."A" FROM "_StoreToUser" stum
          JOIN "User" mgr ON stum."B" = mgr.id
          WHERE mgr.id = $1
      )
    )
    ORDER BY c."initiatedAt" DESC
    `;
    
    const result = await client.query(query, [managerId]);
    
    console.log(`Cierres devueltos (${result.rows.length} registros):`);
    result.rows.forEach(row => {
      console.log(`\n- ID: ${row.id}, GestorId: ${row.gestorId}, Status: ${row.status}`);
      console.log(`- Sales (${row.sales.length}): ${JSON.stringify(row.sales.map(s => s.id))}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
