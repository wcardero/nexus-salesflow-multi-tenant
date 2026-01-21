/**
 * Script de migración para corregir ventas USD con tipo de cambio incorrecto.
 *
 * Problema: Antes de la corrección, el código usaba assignment.storeId (que no existe)
 * para obtener el tipo de cambio, lo que causaba que exchangeRate fuera 1.
 * Esto resultedo en que los valores de ventas USD se guardaran como si fueran MN.
 *
 * Este script:
 * 1. Identifica todas las ventas de productos USD con exchangeRate = 1
 * 2. Obtiene el tipo de cambio correcto de la tienda del gestor
 * 3. Recalcula baseMN, commission, y finalMN
 * 4. Actualiza la base de datos
 *
 * Uso: npx ts-node fix-usd-sales-exchange-rate.ts
 */

import { Pool } from 'pg';
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface Sale {
  id: string;
  inventoryItemId: string;
  gestorId: string;
  productId: string;
  soldAt: Date;
  exchangeRateUsed: number;
  costUSD: number;
  costMN: number;
  margin: number;
  saleUSD: number;
  baseMN: number;
  commission: number;
  finalMN: number;
  paymentStatus: string;
}

interface Product {
  id: string;
  currency: string;
  costUSD: number;
  margin: number;
  commissionRate: number;
}

interface User {
  id: string;
  storeId: string;
}

interface ExchangeRate {
  id: string;
  rate: number;
  startDate: Date;
}

async function getCorrectExchangeRate(storeId: string, soldAt: Date): Promise<number> {
  const result = await pool.query<ExchangeRate>(
    `SELECT * FROM "ExchangeRate"
     WHERE "storeId" = $1 AND "startDate" <= $2
     ORDER BY "startDate" DESC
     LIMIT 1`,
    [storeId, soldAt]
  );
  return result.rows[0]?.rate || 1;
}

async function fixUsdSales(): Promise<void> {
  console.log('=== Corrección de Tipo de Cambio para Ventas USD ===\n');

  try {
    // 1. Obtener todas las ventas con productos USD
    const salesResult = await pool.query<Sale>(`
      SELECT s.* FROM "Sale" s
      JOIN "Product" p ON s."productId" = p.id
      WHERE p.currency = 'USD'
      ORDER BY s."soldAt" DESC
    `);

    const sales = salesResult.rows;
    console.log(`Total de ventas USD encontradas: ${sales.length}\n`);

    if (sales.length === 0) {
      console.log('No hay ventas USD que corregir.');
      return;
    }

    // 2. Obtener productos y usuarios para cada venta
    const productIds = [...new Set(sales.map(s => s.productId))];
    const gestorIds = [...new Set(sales.map(s => s.gestorId))];

    const productsResult = await pool.query<Product>(
      `SELECT * FROM "Product" WHERE id = ANY($1)`,
      [productIds]
    );
    const products = Object.fromEntries(productsResult.rows.map(p => [p.id, p]));

    const usersResult = await pool.query<User>(`SELECT id, "storeId" FROM "User" WHERE id = ANY($1)`, [gestorIds]);
    const users = Object.fromEntries(usersResult.rows.map(u => [u.id, u]));

    // 3. Corregir cada venta
    let correctedCount = 0;
    let alreadyCorrectCount = 0;
    const errors: string[] = [];

    for (const sale of sales) {
      const product = products[sale.productId];
      const user = users[sale.gestorId];

      if (!product) {
        errors.push(`Venta ${sale.id}: Producto no encontrado`);
        continue;
      }

      if (!user?.storeId) {
        errors.push(`Venta ${sale.id}: Gestor ${sale.gestorId} no tiene storeId`);
        continue;
      }

      // Si ya tiene un tipo de cambio razonable (> 1), asumir que está correcto
      if (sale.exchangeRateUsed > 1) {
        alreadyCorrectCount++;
        continue;
      }

      // Obtener el tipo de cambio correcto
      const correctExchangeRate = await getCorrectExchangeRate(user.storeId, sale.soldAt);

      if (correctExchangeRate <= 1) {
        errors.push(`Venta ${sale.id}: No se encontró tipo de cambio válido para tienda ${user.storeId}`);
        continue;
      }

      // Recalcular valores
      const saleUSD = product.costUSD * (1 + product.margin);
      const baseMN = saleUSD * correctExchangeRate;
      const commissionRate = product.commissionRate || 0.1;
      const commission = baseMN * commissionRate;
      const finalMN = baseMN + commission;

      // Calcular diferencia para información
      const oldFinalMN = sale.finalMN;
      const newFinalMN = finalMN * 1; // Una unidad

      // Actualizar la venta
      await pool.query(
        `UPDATE "Sale"
         SET "exchangeRateUsed" = $1, "baseMN" = $2, "commission" = $3, "finalMN" = $4
         WHERE id = $5`,
        [correctExchangeRate, baseMN, commission, finalMN, sale.id]
      );

      correctedCount++;

      const productName = product.currency;
      console.log(`✓ Corregida venta ${sale.id}:`);
      console.log(`  Producto: ${sale.productId}`);
      console.log(`  Tipo de cambio: ${sale.exchangeRateUsed} → ${correctExchangeRate}`);
      console.log(`  Final MN: ${oldFinalMN.toFixed(2)} → ${newFinalMN.toFixed(2)}`);
      console.log(`  Diferencia: ${(newFinalMN - oldFinalMN).toFixed(2)} MN\n`);
    }

    // 4. Resumen
    console.log('\n=== Resumen ===');
    console.log(`Ventas corregidas: ${correctedCount}`);
    console.log(`Ventas ya correctas: ${alreadyCorrectCount}`);
    console.log(`Errores: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\nErrores:');
      errors.forEach(e => console.log(`  - ${e}`));
    }

    console.log('\n✓ Migración completada exitosamente.');

  } catch (error) {
    console.error('Error durante la migración:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixUsdSales()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
