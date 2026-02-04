import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Ensure FRONTEND_URL is set for QR code generation
if (!process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL = 'http://localhost:3000';
  console.log('FRONTEND_URL not set, defaulting to http://localhost:3000');
}

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { testConnection } from './config/database';
import { initializeStorage } from './config/storage';
import authRoutes from './routes/authRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import scanRoutes from './routes/scanRoutes';
import callRoutes from './routes/callRoutes';
import alertRoutes from './routes/alertRoutes';
// import logRoutes from './routes/logRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database and storage
const initializeApp = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    // Initialize storage
    await initializeStorage();

    logger.info('Application initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes will be added here
app.get('/api', (_req, res) => {
  res.json({
    message: 'Masked Calling Parking Alert System API',
    version: '1.0.0',
    status: 'running',
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Vehicle routes
app.use('/api/vehicles', vehicleRoutes);

// Scan routes (public and protected)
app.use('/api/scan', scanRoutes);

// Call routes (public and protected)
app.use('/api/call', callRoutes);

// Alert routes (public and protected)
app.use('/api/alert', alertRoutes);

// Log routes (protected)
// app.use('/api/logs', logRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  await initializeApp();
  
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;