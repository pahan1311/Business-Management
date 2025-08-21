/**
 * Inventory Routes
 */

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { requireStaffOrAdmin, verifyToken } = require('../middleware/auth');

// Authentication and staff role required for all routes
router.use(verifyToken);
router.use(requireStaffOrAdmin);

// Product routes
router.get('/products', inventoryController.getAllProducts);
router.post('/products', inventoryController.createProduct);
router.get('/products/:id', inventoryController.getProductById);
router.put('/products/:id', inventoryController.updateProduct);
router.delete('/products/:id', inventoryController.deleteProduct);

// Stock management routes
router.put('/products/:id/stock', inventoryController.updateStock);
router.get('/products/low-stock', inventoryController.getLowStockProducts);

// Inventory movements
router.get('/movements', inventoryController.getInventoryMovements);

// Statistics
router.get('/stats', inventoryController.getInventoryStats);

module.exports = router;
