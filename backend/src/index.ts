// backend/src/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import { mockDB } from './store';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.send('Nexus SalesFlow API is running!');
});

// Endpoint to get the entire mock database
app.get('/api/db', (req: Request, res: Response) => {
  res.json(mockDB);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
