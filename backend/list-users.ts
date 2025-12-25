import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function listUsers() {
  try {
    const result = await pool.query('SELECT id, name, role, "storeId" FROM "User"');
    console.log('Users in database:');
    console.table(result.rows);
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

listUsers();
