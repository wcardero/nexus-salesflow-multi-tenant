const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    // Actualizar el inventoryItemId de la venta reciente que tiene el formato incorrecto
    const result = await client.query(`
      UPDATE "Sale"
      SET "inventoryItemId" = 'assign-1767076491202-5'
      WHERE "inventoryItemId" = 'invitem-1767079822208-0'
      RETURNING *
    `);
    
    console.log('Venta actualizada:');
    result.rows.forEach(row => {
      console.log(`- ID: ${row.id}, inventoryItemId: ${row.inventoryItemId}, Final MN: ${row.finalMN}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
