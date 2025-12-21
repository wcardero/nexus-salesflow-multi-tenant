
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTables() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('Tables in database:');
    res.rows.forEach(row => console.log(`- ${row.table_name}`));
    await pool.end();
  } catch (err) {
    console.error('Error checking tables:', err);
    process.exit(1);
  }
}

checkTables();
