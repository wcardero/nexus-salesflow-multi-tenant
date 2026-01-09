// backend/src/inventory.test.ts
import { describe, it, expect, vi } from 'vitest';
import db from './db';
import { updateInventoryAfterSale } from './inventory'; // This function doesn't exist yet

vi.mock('./db', () => ({
  default: {
    query: vi.fn(),
  },
}));

describe('updateInventoryAfterSale', () => {
  it('should decrease the quantity of an inventory item', async () => {
    const inventoryItemId = 'inv-001';
    const soldQuantity = 1;
    const initialQuantity = 5;

    // Mock the initial state of the inventory item
    (db.query as vi.Mock).mockResolvedValueOnce({ rows: [{ id: inventoryItemId, quantity: initialQuantity }] });
    // Mock the update query
    (db.query as vi.Mock).mockResolvedValueOnce({ rows: [{ id: inventoryItemId, quantity: initialQuantity - soldQuantity }] });


    await updateInventoryAfterSale(inventoryItemId, soldQuantity);

    expect(db.query).toHaveBeenCalledWith(
      'UPDATE "AssignedInventory" SET quantity = $1 WHERE id = $2',
      [initialQuantity - soldQuantity, inventoryItemId]
    );
  });

    it('should delete the inventory item if quantity becomes zero', async () => {
        const inventoryItemId = 'inv-002';
        const soldQuantity = 5;
        const initialQuantity = 5;

        // Mock the initial state of the inventory item
        (db.query as vi.Mock).mockResolvedValueOnce({ rows: [{ id: inventoryItemId, quantity: initialQuantity }] });
        // Mock the delete query
        (db.query as vi.Mock).mockResolvedValueOnce({ rows: [] });

        await updateInventoryAfterSale(inventoryItemId, soldQuantity);

        expect(db.query).toHaveBeenCalledWith(
            'DELETE FROM "AssignedInventory" WHERE id = $1',
            [inventoryItemId]
        );
    });
});
