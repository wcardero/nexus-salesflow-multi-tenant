const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

const fs = require('fs');
const path = require('path');

(async () => {
  const client = await pool.connect();
  try {
    console.log('🔧 Running migration to add currency and costMN to Product table...');
    const migrationSql = fs.readFileSync(path.join(__dirname, 'migrations', 'add_currency_to_product.sql'), 'utf8');
    await client.query(migrationSql);
    console.log('✅ Columns costMN and currency added successfully to Product table.');
  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
})();