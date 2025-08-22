// API routes for customer management
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

// Define routes here
router.get('/', protect, customerController.getCustomers);
router.get('/:id', protect, customerController.getCustomerById);
router.post('/', protect, customerController.createCustomer);
router.put('/:id', protect, customerController.updateCustomer);
router.delete('/:id', protect, customerController.deleteCustomer);

module.exports = router;
