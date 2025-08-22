// Main entry point for the backend
const express = require('express');
const connectDB = require('./config/database');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const staffRoutes = require('./routes/staffRoutes');
const qrCodeRoutes = require('./routes/qrCodeRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
console.log('Registering API routes...');
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/qr-code', qrCodeRoutes); // Changed from /qrcode to /qr-code to match frontend

// Register users API routes
console.log('Registering users API routes...');
app.use('/api/users', userRoutes);
console.log('User routes registered!');

// Health check endpoint for testing API availability
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      users: '/api/users',
      deliveries: '/api/deliveries',
      // Add other endpoints for testing
    }
  });
});

// Error handler
app.use(errorHandler);

// Connect to DB and start server
connectDB().then(() => {
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
});
