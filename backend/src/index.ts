// backend/src/index.ts
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import db from './db';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ======================================================================
// API Routes
// ======================================================================

app.get('/', (req: Request, res: Response) => {
  res.send('Nexus SalesFlow API is running!');
});

// --- AUTH Endpoints ---
app.post('/api/login', async (req: Request, res: Response) => {
    const { name, password } = req.body;
    if (!name || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    try {
        const result = await db.query('SELECT * FROM "User" WHERE name = $1', [name]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        // Don't send password back to client
        delete user.password;
        res.json(user);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/users', async (req: Request, res: Response) => {
    const { name, password, role, storeId } = req.body;
    if (!name || !password || !role) {
        return res.status(400).json({ message: 'Name, password, and role are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserId = `user-${Date.now()}`; // Generate a unique ID
        const result = await db.query(
            'INSERT INTO "User" (id, name, password, role, "storeId") VALUES ($1, $2, $3, $4, $5) RETURNING id, name, role, "storeId"',
            [newUserId, name, hashedPassword, role, storeId || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('User creation error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/users/:id/password', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    try {
        const result = await db.query('SELECT * FROM "User" WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(oldPassword, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: 'Invalid old password.' });
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE "User" SET password = $1 WHERE id = $2', [hashedNewPassword, id]);
        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// --- GET Endpoints ---
app.get('/api/users', async (req, res) => {
  const { rows } = await db.query('SELECT id, name, role, "storeId" FROM "User"', []);
  res.json(rows);
});

app.get('/api/stores', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM "Store"', []);
  res.json(rows);
});

app.get('/api/products', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM "Product"', []);
  res.json(rows);
});

app.get('/api/inventory', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM "InventoryItem"', []);
  res.json(rows);
});

app.get('/api/sales', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM "Sale"', []);
  res.json(rows);
});

app.get('/api/closings', async (req, res) => {
  // This would require a JOIN for sales
  const { rows } = await db.query('SELECT * FROM "Closing"', []);
  res.json(rows);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
