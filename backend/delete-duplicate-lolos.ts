import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function deleteDuplicateLolos() {
  const ids = ['user-1766509470282', 'user-1766509690351', 'user-1766509163056'];
  for (const id of ids) {
    const result = await pool.query('DELETE FROM "User" WHERE id = $1 RETURNING id, name', [id]);
    console.log('Deleted:', result.rows[0]);
  }
  await pool.end();
}

deleteDuplicateLolos().catch(console.error);
