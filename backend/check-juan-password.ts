import { Pool } from 'pg';
import 'dotenv/config';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkPassword() {
  const result = await pool.query('SELECT * FROM "User" WHERE name = $1', ['juan']);
  console.log('User juan found:', result.rows[0]);
  console.log('Password hash:', result.rows[0].password.substring(0, 50) + '...');
  const match = await bcrypt.compare('test123', result.rows[0].password);
  console.log('Password match:', match);
  await pool.end();
}

checkPassword().catch(console.error);
