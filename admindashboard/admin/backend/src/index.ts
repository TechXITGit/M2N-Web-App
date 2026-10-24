import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';

import { xss } from 'express-xss-sanitizer';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import hotelRoutes from './routes/hotelRoutes';
import publicRoutes from './routes/publicRoutes';
import globalCategoryRoutes from './routes/globalCategoryRoutes';
import bookingRoutes from './routes/bookingRoutes';
import receptionistRoutes from './routes/receptionistRoutes';
import experienceRoutes from './routes/experienceRoutes';
dotenv.config();
const app = express();


// Security Middlewares
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : false)
    : '*',
  credentials: true
}));
app.use(express.json());
app.use(xss());


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/global-categories', globalCategoryRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/receptionists', receptionistRoutes);
app.use('/api/experiences', experienceRoutes);

// Serve static files from the 'dist' folder (which will contain frontend build)
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});


const PORT = (process.env.PORT && process.env.PORT.trim() !== '') ? process.env.PORT : 3000;

app.listen(PORT as any, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
