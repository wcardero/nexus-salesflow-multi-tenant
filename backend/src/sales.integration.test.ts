// backend/src/sales.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app, server } from './index';
import db from './db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nexus_salesflow_secret';

describe('/api/sales', () => {
    let token: string;
    let gestorId: string;
    let storeId: string;
    let productId: string;
    let inventoryItemId: string;

    beforeAll(async () => {
        // Start transaction
        await db.query('BEGIN');

        // Create a store
        const storeResult = await db.query(
            'INSERT INTO "Store" (id, name) VALUES ($1, $2) RETURNING id',
            [`store-${Date.now()}`, `Test Store - ${Date.now()}`]
        );
        storeId = storeResult.rows[0].id;

        // Create a gestor
        const gestorResult = await db.query(
            'INSERT INTO "User" (id, name, password, role, "storeId") VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [`user-${Date.now()}`, 'testgestor', 'password', 'Gestor', storeId]
        );
        gestorId = gestorResult.rows[0].id;

        // Create a product
        const productResult = await db.query(
            'INSERT INTO "Product" (id, name, "costUSD", margin, "commissionRate", "storeId") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [`prod-${Date.now()}`, 'Test Product', 100, 0.2, 0.1, storeId]
        );
        productId = productResult.rows[0].id;

        // Create an exchange rate
        await db.query(
            'INSERT INTO "ExchangeRate" (id, rate, "startDate", "storeId", "endDate") VALUES ($1, $2, $3, $4, $5)',
            [`xr-${Date.now()}`, 30, new Date(), storeId, null]
        );

        // Assign inventory to the gestor
        const inventoryResult = await db.query(
            'INSERT INTO "AssignedInventory" (id, "productId", "gestorId", quantity) VALUES ($1, $2, $3, $4) RETURNING id',
            [`assign-${Date.now()}`, productId, gestorId, 10]
        );
        inventoryItemId = inventoryResult.rows[0].id;

        // Generate a token for the gestor
        token = jwt.sign({ id: gestorId, name: 'testgestor', role: 'Gestor', storeId }, JWT_SECRET, {
            expiresIn: '1h',
        });
    });

    afterAll(async () => {
        // Rollback transaction
        await db.query('ROLLBACK');
        setTimeout(() => server.close(), 500);
    });

    it('should create a sale and update inventory', async () => {
        const response = await request(app)
            .post('/api/sales')
            .set('Authorization', `Bearer ${token}`)
            .send({
                inventoryItemId,
                quantity: 2,
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');

        // Check if the sale was created
        const saleResult = await db.query('SELECT * FROM "Sale" WHERE id = $1', [response.body.id]);
        expect(saleResult.rows.length).toBe(1);

        // Check if the inventory was updated
        const inventoryResult = await db.query('SELECT quantity FROM "AssignedInventory" WHERE id = $1', [inventoryItemId]);
        expect(inventoryResult.rows[0].quantity).toBe(8);
    });
});
