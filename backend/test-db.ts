
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    console.log('Testing connection to:', process.env.DATABASE_URL);
    const res = await pool.query('SELECT NOW()');
    console.log('Connection successful:', res.rows[0]);
    await pool.end();
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
}

test();
