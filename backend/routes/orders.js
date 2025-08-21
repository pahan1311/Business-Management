/**
 * Order Routes
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, requireCustomer, requireStaffOrAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');

// Authentication required for all routes
router.use(verifyToken);

// Get all orders (admin/staff only)
router.get('/', requireStaffOrAdmin, orderController.getAllOrders);

// Get customer's own orders
router.get('/my-orders', requireCustomer, orderController.getMyOrders);

// Create new order (customers only)
router.post('/', requireCustomer, orderController.createOrder);

// Get order by ID (owner or admin)
router.get('/:id', requireOwnershipOrAdmin('customerId'), orderController.getOrderById);

// Update order status (admin/staff only)
router.put('/:id/status', requireStaffOrAdmin, orderController.updateOrderStatus);

// Cancel order
router.put('/:id/cancel', requireOwnershipOrAdmin('customerId'), orderController.cancelOrder);

module.exports = router;
