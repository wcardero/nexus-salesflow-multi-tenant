const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nexusdb'
});

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT p.*, er.rate as currentExchangeRate
      FROM "Product" p
      LEFT JOIN "ExchangeRate" er ON p."storeId" = er."storeId" AND er."endDate" IS NULL
      WHERE p.name = 'jabon'
    `);
    
    console.log('Producto jabón:');
    result.rows.forEach(row => {
      console.log(`- ID: ${row.id}`);
      console.log(`- Costo USD: ${row.costUSD}`);
      console.log(`- Costo MN: ${row.costMN}`);
      console.log(`- Margen: ${row.margin}`);
      console.log(`- Comisión: ${row.commissionRate}`);
      console.log(`- Moneda: ${row.currency}`);
      console.log(`- priceMN: ${row.priceMN}`);
      console.log(`- Tipo de cambio: ${row.currentexchangerate}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
})();
