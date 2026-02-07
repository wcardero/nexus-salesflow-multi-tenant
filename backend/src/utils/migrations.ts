import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    // Create migrations tracking table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "_Migrations" (
        "id" SERIAL PRIMARY KEY,
        "filename" TEXT NOT NULL UNIQUE,
        "executedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get list of already executed migrations
    const executedResult = await pool.query('SELECT "filename" FROM "_Migrations"');
    const executedFiles = new Set(executedResult.rows.map(r => r.filename));
    
    const migrationsDir = path.join(__dirname, '..', '..', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found, skipping...');
      return;
    }
    
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Execute in order (001, 002, 003...)
    
    for (const file of files) {
      if (executedFiles.has(file)) {
        console.log(`  ✓ ${file} (already executed)`);
        continue;
      }
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`  → Executing: ${file}`);
      
      try {
        await pool.query(sql);
        await pool.query(
          'INSERT INTO "_Migrations" ("filename") VALUES ($1)',
          [file]
        );
        console.log(`  ✓ ${file} (executed successfully)`);
      } catch (err: any) {
        // Si el error es porque ya existe (columna, constraint, tabla, etc.), marcar como ejecutada
        const alreadyExistsCodes = ['42701', '42710', '42P07', '23505']; // PostgreSQL error codes for "already exists"
        if (alreadyExistsCodes.includes(err?.code)) {
          await pool.query(
            'INSERT INTO "_Migrations" ("filename") VALUES ($1) ON CONFLICT DO NOTHING',
            [file]
          );
          console.log(`  ✓ ${file} (already applied)`);
        } else {
          console.error(`  ✗ ${file} (failed)`, err);
        }
      }
    }
    
    console.log('Migrations completed');
  } catch (err) {
    console.error('Migration error:', err);
  }
}
