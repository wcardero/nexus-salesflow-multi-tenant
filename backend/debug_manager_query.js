const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    // Verificar el query del manager paso a paso
    const managerId = 'user-1767049095398'; // juan
    
    // Paso 1: Obtener las tiendas del manager
    const step1 = await client.query(`
      SELECT stum."A"
      FROM "_StoreToUser" stum
      JOIN "User" mgr ON stum."B" = mgr.id
      WHERE mgr.id = $1
    `, [managerId]);
    
    console.log('Paso 1 - Tiendas del manager:', step1.rows.map(r => r.A));

    // Paso 2: Obtener los gestores de esas tiendas
    const step2 = await client.query(`
      SELECT u.id, u.name
      FROM "User" u
      WHERE u."storeId" = ANY($1)
    `, [step1.rows.map(r => r.A)]);
    
    console.log('\nPaso 2 - Gestores de esas tiendas:', step2.rows.map(r => `${r.name} (${r.id})`));

    // Paso 3: Obtener los cierres de esos gestores
    const step3 = await client.query(`
      SELECT c.id, c."gestorId", c.status, c."totalFinalMN"
      FROM "Closing" c
      WHERE c."gestorId" = ANY($1)
      ORDER BY c."initiatedAt" DESC
    `, [step2.rows.map(r => r.id)]);
    
    console.log('\nPaso 3 - Cierres de esos gestores:', step3.rows.length);
    step3.rows.forEach(r => {
      console.log(`- ID: ${r.id}, GestorId: ${r.gestorId}, Status: ${r.status}`);
    });

    // Verificar si el gestorId del cierre coincide con alguno de los gestores encontrados
    console.log('\n\nVerificación:');
    console.log(`GestorId del cierre: user-1767057022026 (lolo)`);
    console.log(`¿Está en los gestores encontrados? ${step2.rows.some(r => r.id === 'user-1767057022026') ? 'SÍ' : 'NO'}`);
    console.log(`¿El storeId de lolo (${await client.query('SELECT "storeId" FROM "User" WHERE id = $1', ['user-1767057022026']).rows[0].storeId}) coincide con las tiendas del manager (${step1.rows.map(r => r.A).join(', ')})? ${step1.rows.some(r => r.A === (await client.query('SELECT "storeId" FROM "User" WHERE id = $1', ['user-1767057022026'])).rows[0].storeId) ? 'SÍ' : 'NO'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
