/**
 * Customer Routes
 */

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { requireCustomerAccess, verifyToken, requireStaffOrAdmin } = require('../middleware/auth');

// Authentication required for all routes
router.use(verifyToken);

// Get all customers (admin/staff only)
router.get('/', requireStaffOrAdmin, customerController.getAllCustomers);

// Get customer by ID
router.get('/:id', requireCustomerAccess, customerController.getCustomerById);

// Create new customer (admin only)
router.post('/', requireStaffOrAdmin, customerController.createCustomer);

// Update customer
router.put('/:id', requireCustomerAccess, customerController.updateCustomer);

// Delete customer (admin only)
router.delete('/:id', requireStaffOrAdmin, customerController.deleteCustomer);

// Get customer statistics
router.get('/:id/stats', requireCustomerAccess, customerController.getCustomerStats);

module.exports = router;
