const { Pool } = require('pg');
require('dotenv').config();

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
      WHERE u.name = 'lala'
      LIMIT 5
    `);
    
    console.log('AssignedInventory para gestor lala:');
    result.rows.forEach(row => {
      console.log(`- ID: ${row.id}, Product: ${row.productname}, Gestor: ${row.gestorname}, Status: ${row.status}, GestorId: ${row.gestorid}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
