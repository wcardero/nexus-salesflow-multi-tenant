// backend/src/sales.ts
import db from './db';
import { Sale } from './types';

export const createSale = async (saleData: Omit<Sale, 'id'>): Promise<Sale> => {
    const {
        inventoryItemId,
        gestorId,
        soldAt,
        exchangeRateUsed,
        costUSD,
        margin,
        saleUSD,
        baseMN,
        commission,
        finalMN,
    } = saleData;

    const newSaleId = `sale-${Date.now()}`;

    const result = await db.query(
        'INSERT INTO "Sale" (id, "inventoryItemId", "gestorId", "soldAt", "exchangeRateUsed", "costUSD", margin, "saleUSD", "baseMN", commission, "finalMN") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
        [
            newSaleId,
            inventoryItemId,
            gestorId,
            soldAt,
            exchangeRateUsed,
            costUSD,
            margin,
            saleUSD,
            baseMN,
            commission,
            finalMN,
        ]
    );

    return result.rows[0];
};
