// backend/src/db.ts
import { Pool } from 'pg';
require('dotenv').config(); // Use require for dotenv for broader compatibility

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Add a connection test method
const connect = async () => {
  try {
    await pool.query('SELECT NOW()');
  } catch (err) {
    console.error('--- Database connection FAILED ---', err);
    process.exit(1); // Exit process if DB connection fails on startup
  }
};

export default {
  query: (text: string, params: any[] = []) => pool.query(text, params),
  connect: connect,
};
