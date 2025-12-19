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
  // In a real app, you'd probably do a JOIN or separate query for exchange rates
  res.json(rows);
});

// Add other GET endpoints as needed...

// ======================================================================
// Server Startup
// ======================================================================

const createDefaultAdmin = async () => {
    try {
        const result = await db.query('SELECT * FROM "User" WHERE role = $1', ['ADMIN']);
        if (result.rows.length === 0) {
            console.log('No ADMIN user found. Creating default admin...');
            const adminId = 'user-admin-01';
            const adminName = 'admin';
            const adminPass = 'admin123';
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(adminPass, saltRounds);
            
            await db.query(
                'INSERT INTO "User" (id, name, password, role) VALUES ($1, $2, $3, $4)',
                [adminId, adminName, hashedPassword, 'ADMIN']
            );
            console.log(`Default admin user '${adminName}' with password '${adminPass}' created.`);
        } else {
            console.log('Admin user already exists.');
        }
    } catch (error: any) {
        // Error code '42P01' is for 'undefined_table' in PostgreSQL
        if (error.code === '42P01') {
            console.warn('Tables not found. Please run the schema SQL script.');
        } else {
            console.error('Error creating default admin:', error);
        }
    }
};

app.listen(PORT, async () => {
  console.log(`Server is listening on port ${PORT}`);
  // Check for admin user on startup
  await createDefaultAdmin();
});