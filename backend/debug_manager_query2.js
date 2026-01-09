const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const managerId = 'user-1767049095398'; // juan
    
    // Paso 1: Obtener las tiendas del manager
    const step1Result = await client.query(`
      SELECT stum."A"
      FROM "_StoreToUser" stum
      JOIN "User" mgr ON stum."B" = mgr.id
      WHERE mgr.id = $1
    `, [managerId]);
    
    const storeIds = step1Result.rows.map(r => r.A);
    console.log('Paso 1 - Tiendas del manager:', storeIds);

    // Paso 2: Obtener el storeId de lolo
    const loloResult = await client.query('SELECT "storeId" FROM "User" WHERE id = $1', ['user-1767057022026']);
    const loloStoreId = loloResult.rows[0].storeId;
    console.log('Paso 2 - StoreId de lolo:', loloStoreId);

    // Paso 3: Verificar si coincide
    console.log('Paso 3 - ¿Coincide?', storeIds.includes(loloStoreId) ? 'SÍ' : 'NO');

    // Paso 4: Obtener los gestores de esas tiendas
    const step4Result = await client.query(`
      SELECT u.id, u.name, u."storeId"
      FROM "User" u
      WHERE u."storeId" = ANY($1)
    `, [storeIds]);
    
    console.log('\nPaso 4 - Gestores de esas tiendas:', step4Result.rows.map(r => `${r.name} (${r.id})`));

    // Paso 5: Obtener los cierres de esos gestores
    const step5Result = await client.query(`
      SELECT c.id, c."gestorId", c.status, c."totalFinalMN"
      FROM "Closing" c
      WHERE c."gestorId" = ANY($1)
      ORDER BY c."initiatedAt" DESC
    `, [step4Result.rows.map(r => r.id)]);
    
    console.log('\nPaso 5 - Cierres de esos gestores:', step5Result.rows.length);
    step5Result.rows.forEach(r => {
      console.log(`- ID: ${r.id}, GestorId: ${r.gestorId}, Status: ${r.status}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
