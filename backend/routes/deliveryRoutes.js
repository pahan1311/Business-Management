// API routes for delivery tracking
const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { protect } = require('../middleware/auth');

// Define routes here
router.get('/', protect, deliveryController.getDeliveries);
router.get('/delivery-person/:deliveryPersonId', protect, deliveryController.getDeliveriesByDeliveryPerson);
router.get('/:id', protect, deliveryController.getDeliveryById);
router.post('/', protect, deliveryController.createDelivery);
router.put('/:id', protect, deliveryController.updateDelivery);
router.patch('/:id/status', protect, deliveryController.updateDeliveryStatus);
router.patch('/:id/assign', protect, deliveryController.assignDeliveryPerson);
router.delete('/:id', protect, deliveryController.deleteDelivery);

module.exports = router;
