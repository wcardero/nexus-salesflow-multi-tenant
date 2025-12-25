import { Pool } from 'pg';
import 'dotenv/config';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addTestGestor() {
  try {
    const hashedPassword = await bcrypt.hash('test123', 10);
    const newUserId = `user-${Date.now()}`;
    const result = await pool.query(
      'INSERT INTO "User" (id, name, password, role, "storeId") VALUES ($1, $2, $3, $4, $5) RETURNING id, name, role, "storeId"',
      [newUserId, 'gestorprueba', hashedPassword, 'Gestor', 'store-1766447230244']
    );
    console.log('Gestor de prueba creado:');
    console.table(result.rows[0]);
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

addTestGestor();
