const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT u.id, u.name, u.role, u."storeId", s.name as storeName
      FROM "User" u
      LEFT JOIN "_StoreToUser" stu ON u.id = stu."B"
      LEFT JOIN "Store" s ON stu."A" = s.id
      WHERE u.name IN ('lolo', 'manager1')
      ORDER BY u.name
    `);
    
    console.log('Usuarios lolo y manager1:');
    result.rows.forEach(row => {
      console.log(`\n- Name: ${row.name}, Role: ${row.role}`);
      console.log(`  ID: ${row.id}`);
      console.log(`  StoreId: ${row.storeId}`);
      console.log(`  StoreName: ${row.storeName}`);
    });

    // Verificar las relaciones en _StoreToUser
    const stuResult = await client.query(`
      SELECT stu."A" as storeId, stu."B" as userId, u.name as userName, s.name as storeName
      FROM "_StoreToUser" stu
      JOIN "User" u ON stu."B" = u.id
      JOIN "Store" s ON stu."A" = s.id
      WHERE u.name IN ('lolo', 'manager1')
      ORDER BY u.name
    `);

    console.log('\n\nRelaciones en _StoreToUser:');
    stuResult.rows.forEach(row => {
      console.log(`\n- User: ${row.userName} (${row.userId})`);
      console.log(`  Store: ${row.storeName} (${row.storeId})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
