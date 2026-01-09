const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    // Verificar el rol de juan
    const result = await client.query(`
      SELECT id, name, role
      FROM "User"
      WHERE id = $1
    `, ['user-1767049095398']); // juan

    console.log('Rol de juan:', result.rows[0].role);

    // Verificar qué valores tiene el enum Role
    const roleEnum = await client.query(`
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'Role'
      )
      ORDER BY enumsortorder
    `);

    console.log('\nValores del enum Role:');
    roleEnum.rows.forEach(r => {
      console.log(`- ${r.enumlabel}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
