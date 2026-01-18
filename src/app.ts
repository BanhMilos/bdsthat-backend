import cors from 'cors';
import express from 'express';
import { json } from 'express';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/authRoutes';
import propertyRouter from './routes/propertyRoutes';
import listingRouter from './routes/listingRoutes';
import mediaRouter from './routes/mediaRoutes';
import documentRouter from './routes/documentRoutes';
import favoriteRouter from './routes/favoriteRoutes';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(json({ limit: '10kb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/auth', authRouter);
app.use('/property', propertyRouter);
app.use('/listing', listingRouter);
app.use('/media', mediaRouter);
app.use('/documents', documentRouter);
app.use('/favorites', favoriteRouter);

app.use(errorHandler);

export default app;
