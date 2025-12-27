const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('Verificando tabla InventoryConflict...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'InventoryConflict'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Tabla InventoryConflict existe');
      
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'InventoryConflict' 
        ORDER BY ordinal_position;
      `);
      
      console.log('Columnas de InventoryConflict:');
      columns.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('❌ Tabla InventoryConflict NO existe');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
