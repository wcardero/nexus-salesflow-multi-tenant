import { body, validationResult } from 'express-validator';

// Validation middleware for product creation/update
const validateProduct = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Product name must be between 1 and 100 characters'),
  body('costUSD').isFloat({ min: 0.01 }).withMessage('Cost must be a positive number'),
  body('margin').isFloat({ min: 0, max: 1 }).withMessage('Margin must be between 0 and 100%'),
  body('commissionRate').optional().isFloat({ min: 0, max: 1 }).withMessage('Commission rate must be between 0 and 100%'),
  body('storeId').optional().isUUID().withMessage('Store ID must be a valid UUID'),
];

// Create product endpoint
app.post('/api/products', authenticateToken, validateProduct, async (req: Request, res: Response, next: any, db: any) => {
  const requestingUser = (req as any).user;

  if (requestingUser.role !== 'Manager' && requestingUser.role !== 'Director') {
    return res.status(403).json({ message: 'Only Managers and Directors can create products.' });
  }

  const { name, costUSD, margin, commissionRate, storeId } = req.body;

  if (!name || !costUSD || margin === undefined) {
    return res.status(400).json({ message: 'Name, cost, and margin are required' });
  }

  const finalStoreId = storeId || requestingUser.storeId;

  if (requestingUser.role === 'Director' && !finalStoreId) {
    return res.status(400).json({ message: 'Directors must provide their store ID when creating products.' });
  }

  try {
    const productId = `prod-${Date.now()}`;
    const result = await db.query(
      'INSERT INTO "Product" (id, name, "costUSD", margin, "commissionRate", "storeId") VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [productId, name, parseFloat(costUSD), parseFloat(margin), commissionRate ? parseFloat(commissionRate) : null, finalStoreId]
    );

    console.log('[create-product] Product created:', result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update product endpoint
app.put('/api/products/:id', authenticateToken, validateProduct, async (req: Request, res: Response, next: any, db: any) => {
  const requestingUser = (req as any).user;
  const { id } = req.params;

  if (requestingUser.role !== 'Manager' && requestingUser.role !== 'Director') {
    return res.status(403).json({ message: 'Only Managers and Directors can update products.' });
  }

  const { name, costUSD, margin, commissionRate } = req.body;

  if (!name || !costUSD || margin === undefined) {
    return res.status(400).json({ message: 'Name, cost, and margin are required' });
  }

  try {
    const existingProduct = await db.query('SELECT * FROM "Product" WHERE id = $1', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const product = existingProduct.rows[0];

    // Check if product is assigned to any gestor
    const assignedCheck = await db.query(
      'SELECT COUNT(*) FROM "InventoryItem" WHERE "productId" = $1',
      [id]
    );
    const isAssigned = parseInt(assignedCheck.rows[0].count) > 0;

    if (isAssigned) {
      return res.status(400).json({ message: 'El producto no puede ser editado ni eliminado porque se encuentra asignado a un gestor.' });
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (name !== undefined) {
      updateFields.push('name');
      updateValues.push(name);
    }
    if (costUSD !== undefined) {
      updateFields.push('"costUSD"');
      updateValues.push(parseFloat(costUSD));
    }
    if (margin !== undefined) {
      updateFields.push('margin');
      updateValues.push(parseFloat(margin));
    }
    if (commissionRate !== undefined) {
      updateFields.push('"commissionRate"');
      updateValues.push(parseFloat(commissionRate));
    }

    const updateSetClause = updateFields.map((f, i) => `"${f}" = $${i + 1}`).join(', ');

    const result = await db.query(
      'UPDATE "Product" SET ' + updateSetClause + ' WHERE id = $1 RETURNING *',
      updateValues.concat([id])
    );

    console.log('[update-product] Product updated:', result.rows[0]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete product endpoint
app.delete('/api/products/:id', authenticateToken, async (req: Request, res: Response, next: any, db: any) => {
  const requestingUser = (req as any).user;
  const { id } = req.params;

  if (requestingUser.role !== 'Manager' && requestingUser.role !== 'Director') {
    return res.status(403).json({ message: 'Only Managers and Directors can delete products.' });
  }

  try {
    const existingProduct = await db.query('SELECT * FROM "Product" WHERE id = $1', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const product = existingProduct.rows[0];

    // Check if product is assigned to any gestor
    const assignedCheck = await db.query(
      'SELECT COUNT(*) FROM "InventoryItem" WHERE "productId" = $1',
      [id]
    );
    const isAssigned = parseInt(assignedCheck.rows[0].count) > 0;

    if (isAssigned) {
      return res.status(400).json({ message: 'El producto no puede ser editado ni eliminado porque se encuentra asignado a un gestor.' });
    }

    await db.query('DELETE FROM "Product" WHERE id = $1', [id]);

    console.log('[delete-product] Product deleted:', product.id);

    res.json(product);
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export { validateProduct, createProductEndpoint, updateProductEndpoint, deleteProductEndpoint };
