const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const stores = await client.query('SELECT * FROM "Store"');
    console.log(`Tiendas (${stores.rows.length} registros):`);
    stores.rows.forEach(s => {
      console.log(`\n- ID: ${s.id}, Name: ${s.name}`);
    });

    const users = await client.query('SELECT * FROM "User"');
    console.log(`\n\nUsuarios (${users.rows.length} registros):`);
    users.rows.forEach(u => {
      console.log(`\n- ID: ${u.id}, Name: ${u.name}, Role: ${u.role}, StoreId: ${u.storeId}`);
    });

    const stu = await client.query('SELECT * FROM "_StoreToUser"');
    console.log(`\n\nRelaciones Store-User (${stu.rows.length} registros):`);
    stu.rows.forEach(row => {
      console.log(`- StoreId: ${row.A}, UserId: ${row.B}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
