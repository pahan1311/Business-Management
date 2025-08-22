// API routes for order management
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// Define routes here
router.get('/', protect, orderController.getOrders);
router.get('/customer/:customerId', protect, orderController.getOrdersByCustomer);
router.get('/:id', protect, orderController.getOrderById);
router.post('/', protect, orderController.createOrder);
router.put('/:id', protect, orderController.updateOrder);
router.patch('/:id/status', protect, orderController.updateOrderStatus);
router.patch('/:id/assign', protect, orderController.assignStaff);
router.delete('/:id', protect, orderController.deleteOrder);

module.exports = router;
