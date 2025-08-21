/**
 * Main Routes Index
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const customerRoutes = require('./customer');
const staffRoutes = require('./staff');
const deliveryRoutes = require('./delivery');
const inventoryRoutes = require('./inventory');
const orderRoutes = require('./orders');
const qrcodeRoutes = require('./qrcode');
const inquiryRoutes = require('./inquiries');

// API Information endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Customer Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/v1/auth',
      admin: '/api/v1/admin',
      customers: '/api/v1/customers',
      staff: '/api/v1/staff',
      delivery: '/api/v1/delivery',
      inventory: '/api/v1/inventory',
      orders: '/api/v1/orders',
      qrcode: '/api/v1/qrcode',
      inquiries: '/api/v1/inquiries',
    },
    documentation: '/api/v1/docs',
  });
});

// Route handlers
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/customers', customerRoutes);
router.use('/staff', staffRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', orderRoutes);
router.use('/qrcode', qrcodeRoutes);
router.use('/inquiries', inquiryRoutes);

module.exports = router;
