import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import db from './db';
import { generalLimiter } from './middleware/rate-limit.middleware';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import storesRoutes from './routes/stores.routes';
import inventoryRoutes from './routes/inventory.routes';
import salesRoutes from './routes/sales.routes';
import closingsRoutes from './routes/closings.routes';
import directorRoutes from './routes/director.routes';
import productsRoutes from './routes/products.routes';
import auditRoutes from './routes/audit.routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
  app.use(generalLimiter);
}

app.get('/', (req: Request, res: Response) => {
  res.send('Nexus SalesFlow API is running!');
});

app.use('/api', authRoutes);
app.use('/api', usersRoutes);
app.use('/api', storesRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', salesRoutes);
app.use('/api', closingsRoutes);
app.use('/api', directorRoutes);
app.use('/api', productsRoutes);
app.use('/api', auditRoutes);

app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
