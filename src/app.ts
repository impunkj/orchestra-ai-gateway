import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import queryRouter from './routes/query'; // 1. Import our new router module

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 2. Mount the streaming gateway routes under the core namespace
app.use('/api/v1/query', queryRouter);

// Basic health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'core-ai-gateway'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 [core-ai-gateway] Server running smoothly on http://localhost:${PORT}`);
});