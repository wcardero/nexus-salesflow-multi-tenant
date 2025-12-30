import db from './db';

export const updateInventoryAfterSale = async (assignedInventoryId: string, soldQuantity: number): Promise<void> => {
    const inventoryResult = await db.query(
        'SELECT quantity FROM "AssignedInventory" WHERE id = $1',
        [assignedInventoryId]
    );

    if (inventoryResult.rows.length === 0) {
        throw new Error('Inventory not found');
    }

    const currentQuantity = inventoryResult.rows[0].quantity;
    const newQuantity = currentQuantity - soldQuantity;

    if (newQuantity < 0) {
        throw new Error('Sold quantity cannot be greater than current quantity');
    }

    if (newQuantity === 0) {
        await db.query('DELETE FROM "AssignedInventory" WHERE id = $1', [assignedInventoryId]);
    } else {
        await db.query('UPDATE "AssignedInventory" SET quantity = $1 WHERE id = $2', [newQuantity, assignedInventoryId]);
    }
};
