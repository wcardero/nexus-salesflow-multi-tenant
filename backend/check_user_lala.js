const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT u.id, u.name, u.role, u."storeId"
      FROM "User" u
      WHERE u.name = 'lala'
      LIMIT 5
    `);
    
    console.log('Usuario lala:');
    result.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Nombre: ${row.name}, Rol: ${row.role}, StoreId: ${row.storeid}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
