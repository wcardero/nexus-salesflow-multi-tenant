const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    // Verificar qué devuelve el GET /api/closings para un gestor
    const loloId = 'user-1767057022026';
    
    const result = await client.query(`
      SELECT c.*, COALESCE(json_agg(
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
      WHERE c."gestorId" = $1
      GROUP BY c.id
      ORDER BY c."initiatedAt" DESC
    `, [loloId]);
    
    console.log(`Cierres de lolo (${result.rows.length} registros):`);
    result.rows.forEach(row => {
      console.log(`\n- ID: ${row.id}`);
      console.log(`- Status: ${row.status}`);
      console.log(`- Sales: ${JSON.stringify(row.sales.map(s => s.id))}`);
    });

    // Verificar para el manager
    const managerId = 'user-1767049028882';
    const managerResult = await client.query(`
      SELECT c.*, COALESCE(json_agg(
        json_build_object(
          'id', sm.id,
          'finalMN', sm."finalMN",
          'baseMN', sm."baseMN",
          'commission', sm.commission
        )
      ) FILTER (WHERE sm.id IS NOT NULL), '[]') AS sales
      FROM "Closing" c
      LEFT JOIN "_ClosingToSale" c2s ON c.id = c2s."A"
      LEFT JOIN "Sale" sm ON c2s."B" = sm.id
      WHERE c."gestorId" IN (
        SELECT u.id FROM "User" u
        WHERE u."storeId" IN (
          SELECT stum."A" FROM "_StoreToUser" stum
          JOIN "User" mgr ON stum."B" = mgr.id
          WHERE mgr.id = $1
        )
      )
      GROUP BY c.id
      ORDER BY c."initiatedAt" DESC
    `, [managerId]);
    
    console.log(`\n\nCierres para el manager (${managerResult.rows.length} registros):`);
    managerResult.rows.forEach(row => {
      console.log(`\n- ID: ${row.id}, GestorId: ${row.gestorId}, Status: ${row.status}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
