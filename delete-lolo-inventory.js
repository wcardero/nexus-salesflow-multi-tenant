import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT ai.*, p.name as productName, u.name as gestorName, u.id as gestorId
      FROM "AssignedInventory" ai
      JOIN "Product" p ON ai."productId" = p.id
      JOIN "User" u ON ai."gestorId" = u.id
      WHERE u.name = 'lolo'
    `);
    
    console.log(`Inventario asignado a lolo (${result.rows.length} registros):`);
    result.rows.forEach(row => {
      console.log(`- ID: ${row.id}, Product: ${row.productname}, Gestor: ${row.gestorname}, Status: ${row.status}`);
    });

    if (result.rows.length === 0) {
      console.log('No se encontró inventario asignado a lolo');
      return;
    }

    console.log('\nEliminando inventario asignado a lolo...');
    const deleteResult = await client.query(`
      DELETE FROM "AssignedInventory"
      WHERE id IN (
        SELECT ai.id
        FROM "AssignedInventory" ai
        JOIN "User" u ON ai."gestorId" = u.id
        WHERE u.name = 'lolo'
      )
      RETURNING *
    `);

    console.log(`\n${deleteResult.rows.length} registros eliminados exitosamente`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
