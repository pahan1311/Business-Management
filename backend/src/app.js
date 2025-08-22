const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const { logger } = require('./config/logger');
const { errorHandler } = require('./middlewares/errorHandler');
const { requestId } = require('./middlewares/requestId');
const { setupRateLimiting } = require('./config/security');

// Import routes
const authRoutes = require('./modules/auth/routes');
const userRoutes = require('./modules/users/routes');
const customerRoutes = require('./modules/customers/routes');
const productRoutes = require('./modules/inventory/routes');
const orderRoutes = require('./modules/orders/routes');
const deliveryRoutes = require('./modules/deliveries/routes');
const partnerRoutes = require('./modules/delivery-partners/routes');
const taskRoutes = require('./modules/tasks/routes');
const inquiryRoutes = require('./modules/inquiries/routes');
const qrRoutes = require('./modules/qr/routes');
const metricsRoutes = require('./modules/metrics/routes');

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Basic middleware
app.use(requestId);
app.use(pinoHttp({ logger }));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
setupRateLimiting(app);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/inventory', productRoutes); // Both inventory and products use the same routes
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/deliveries', deliveryRoutes);
app.use('/api/v1/partners', partnerRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/inquiries', inquiryRoutes);
app.use('/api/v1/qr', qrRoutes);
app.use('/api/v1/metrics', metricsRoutes);
app.use('/api/v1/reports', metricsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
