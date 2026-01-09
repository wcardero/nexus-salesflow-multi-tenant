const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    // Insertar la relación faltante de lolo con la tienda
    const result = await client.query(`
      INSERT INTO "_StoreToUser" ("A", "B") VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING *
    `, ['store-1767049028884', 'user-1767057022026']);
    
    console.log('Relación agregada:');
    console.log(`- StoreId: ${result.rows[0].A}`);
    console.log(`- UserId: ${result.rows[0].B}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
