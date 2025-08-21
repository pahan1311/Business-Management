/**
 * Delivery Routes
 */

const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { requireDelivery, verifyToken, requireStaffOrAdmin } = require('../middleware/auth');

// Authentication required for all routes
router.use(verifyToken);

// Get all deliveries (admin/staff only)
router.get('/', requireStaffOrAdmin, deliveryController.getAllDeliveries);

// Get delivery person's deliveries
router.get('/my-deliveries', requireDelivery, deliveryController.getMyDeliveries);

// Create new delivery (admin/staff only)
router.post('/', requireStaffOrAdmin, deliveryController.createDelivery);

// Get delivery by ID
router.get('/:id', deliveryController.getDeliveryById);

// Update delivery status
router.put('/:id/status', deliveryController.updateDeliveryStatus);

// Assign delivery person (admin/staff only)
router.put('/:id/assign', requireStaffOrAdmin, deliveryController.assignDeliveryPerson);

// Track delivery by tracking number (public)
router.get('/track/:trackingNumber', deliveryController.trackDelivery);

// Get delivery statistics (admin/staff only)
router.get('/stats/overview', requireStaffOrAdmin, deliveryController.getDeliveryStats);

module.exports = router;
