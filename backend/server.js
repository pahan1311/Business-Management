// Main entry point for the backend
const express = require('express');
const connectDB = require('./config/database');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

const customerRoutes = require('./routes/customerRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const staffRoutes = require('./routes/staffRoutes');
const qrCodeRoutes = require('./routes/qrCodeRoutes');

const app = express();

app.use(express.json());

// API routes
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/qrcode', qrCodeRoutes);

// Error handler
app.use(errorHandler);

// Connect to DB and start server
connectDB().then(() => {
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
});
