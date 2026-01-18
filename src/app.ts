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
import chatRouter from './routes/chatRoutes';
import appointmentRouter from './routes/appointmentRoutes';
import notificationRouter from './routes/notificationRoutes';
import investorRouter from './routes/investorRoutes';
import projectRouter from './routes/projectRoutes';
import newsRouter from './routes/newsRoutes';
import suggestRouter from './routes/suggestRoutes';
import dashboardRouter from './routes/dashboardRoutes';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(json({ limit: '10kb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes with /api/v1/fe prefix to match Postman collection
app.use('/api/v1/fe/user', authRouter);
app.use('/api/v1/fe/user', favoriteRouter);
app.use('/api/v1/fe/property', propertyRouter);
app.use('/api/v1/fe/listing', listingRouter);
app.use('/api/v1/fe/media', mediaRouter);
app.use('/api/v1/fe/document', documentRouter);
app.use('/api/v1/fe/chat', chatRouter);
app.use('/api/v1/fe/appointment', appointmentRouter);
app.use('/api/v1/fe/notification', notificationRouter);
app.use('/api/v1/fe/investor', investorRouter);
app.use('/api/v1/fe/project', projectRouter);
app.use('/api/v1/fe/suggest', suggestRouter);
app.use('/api/v1/fe/dashboard', dashboardRouter);

// News routes with mixed prefixes (/api/v1/admin and /api/v1/fe)
app.use('/api/v1', newsRouter);

app.use(errorHandler);

export default app;
