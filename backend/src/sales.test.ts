// backend/src/sales.test.ts
import { describe, it, expect, vi } from 'vitest';
import db from './db';
import { createSale } from './sales'; // This function doesn't exist yet

vi.mock('./db', () => ({
  default: {
    query: vi.fn(),
  },
}));

describe('createSale', () => {
  it('should create a sale and return the new sale object', async () => {
    const saleData = {
      inventoryItemId: 'inv-001',
      gestorId: 'gestor-001',
      soldAt: new Date(),
      exchangeRateUsed: 300,
      costUSD: 50,
      margin: 0.2,
      saleUSD: 60,
      baseMN: 18000,
      commission: 1800,
      finalMN: 16200,
    };
    const now = 1234567890;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const mockSale = { id: `sale-${now}`, ...saleData };
    (db.query as vi.Mock).mockResolvedValueOnce({ rows: [mockSale] });

    const result = await createSale(saleData);

    expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO "Sale" (id, "inventoryItemId", "gestorId", "soldAt", "exchangeRateUsed", "costUSD", margin, "saleUSD", "baseMN", commission, "finalMN") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [
        `sale-${now}`,
        saleData.inventoryItemId,
        saleData.gestorId,
        saleData.soldAt,
        saleData.exchangeRateUsed,
        saleData.costUSD,
        saleData.margin,
        saleData.saleUSD,
        saleData.baseMN,
        saleData.commission,
        saleData.finalMN,
      ]
    );

    expect(result).toEqual(mockSale);
  });
});
