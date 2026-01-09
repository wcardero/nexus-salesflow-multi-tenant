const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    // Simular exactamente el query del backend para el manager
    const managerId = 'user-1767049095398'; // juan
    
    const query = `
      SELECT c.*, COALESCE(json_agg(s.*) FILTER (WHERE s.id IS NOT NULL), '[]') AS sales
      FROM "Closing" c
      LEFT JOIN "_ClosingToSale" c2s ON c.id = c2s."A"
      LEFT JOIN "Sale" s ON c2s."B" = s.id
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
    `;
    
    const result = await client.query(query, [managerId]);
    
    console.log(`Cierres devueltos por el query del backend (${result.rows.length} registros):`);
    result.rows.forEach(row => {
      console.log(`\n- ID: ${row.id}, GestorId: ${row.gestorId}, Status: ${row.status}`);
    });

    // Verificar directamente qué gestores están en la tienda del manager
    const gestoresEnTienda = await client.query(`
      SELECT u.id, u.name, u."storeId"
      FROM "User" u
      WHERE u."storeId" IN (
        SELECT stum."A" FROM "_StoreToUser" stum
          JOIN "User" mgr ON stum."B" = mgr.id
          WHERE mgr.id = $1
      )
    `, [managerId]);

    console.log(`\n\nGestores en la tienda del manager (${gestoresEnTienda.rows.length} registros):`);
    gestoresEnTienda.rows.forEach(u => {
      console.log(`- ${u.name} (${u.id}) con StoreId: ${u.storeId}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
