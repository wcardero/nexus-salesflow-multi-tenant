// backend/src/db.ts
import { Pool } from 'pg';
import 'dotenv/config';

console.log('--- Initializing DB Pool ---'); // Debug log
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default {
  query: (text: string, params: any[]) => pool.query(text, params),
};
