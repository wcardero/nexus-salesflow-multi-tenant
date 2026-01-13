import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb',
});

async function updateRoleEnum() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');


    // 1. Add new value to enum (temporarily as 'DirectorTEMP')
    await client.query("ALTER TYPE \"Role\" ADD VALUE 'DirectorTEMP'");

    // 2. Update any existing records that might need the new value
    // (This is just in case there are any records with incorrect role values)


    // 3. Drop and recreate the enum properly
    // First, we need to drop the foreign key constraints temporarily
    await client.query('ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT');
    await client.query('ALTER TABLE "User" ALTER COLUMN "role" TYPE VARCHAR(50)');

    // Drop the old enum
    await client.query('DROP TYPE "Role"');

    // Create the new enum with all values
    await client.query('CREATE TYPE "Role" AS ENUM (\'Admin\', \'Director\', \'Manager\', \'Gestor\')');

    // Update column back to enum type
    await client.query('ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role"');

    await client.query('COMMIT');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating Role enum:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateRoleEnum().catch(console.error);
