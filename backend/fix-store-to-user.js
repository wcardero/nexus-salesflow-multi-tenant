const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

(async () => {
  try {
    // Get all users with storeId
    const usersWithStore = await pool.query(
      'SELECT id, name, role, "storeId" FROM "User" WHERE "storeId" IS NOT NULL'
    );

    console.log(`Found ${usersWithStore.rows.length} users with storeId`);

    // Clear existing _StoreToUser entries
    await pool.query('DELETE FROM "_StoreToUser"');
    console.log('Cleared _StoreToUser table');

    // Rebuild _StoreToUser entries
    for (const user of usersWithStore.rows) {
      await pool.query(
        'INSERT INTO "_StoreToUser" ("A", "B") VALUES ($1, $2)',
        [user.storeId, user.id]
      );
      console.log(`Added: ${user.name} (role: ${user.role}) to store ${user.storeId}`);
    }

    console.log('Fixed _StoreToUser table successfully');

    await pool.end();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
