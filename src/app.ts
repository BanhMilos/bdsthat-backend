import cors from 'cors';
import express from 'express';
import { json } from 'express';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/authRoutes';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(json({ limit: '10kb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRouter);

app.use(errorHandler);

export default app;
