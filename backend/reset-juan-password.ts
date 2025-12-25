import { Pool } from 'pg';
import 'dotenv/config';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateJuanPassword() {
  const hashedPassword = await bcrypt.hash('test123', 10);
  const result = await pool.query(
    'UPDATE "User" SET password = $1 WHERE name = $2 RETURNING id, name, role, "storeId"',
    [hashedPassword, 'juan']
  );
  console.log('Juan password updated:');
  console.table(result.rows[0]);
  await pool.end();
}

updateJuanPassword().catch(console.error);
