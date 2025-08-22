// API routes for inventory management
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/products', inventoryController.getPublicProducts);
router.get('/categories', inventoryController.getCategories);
router.get('/products/:id', inventoryController.getPublicProductById);

// Protected routes
router.get('/', protect, inventoryController.getInventory);
router.get('/low-stock', protect, inventoryController.getLowStock);
router.get('/:id', protect, inventoryController.getInventoryById);
router.post('/', protect, inventoryController.createInventory);
router.put('/:id', protect, inventoryController.updateInventory);
router.patch('/:id/stock', protect, inventoryController.updateStock);
router.delete('/:id', protect, inventoryController.deleteInventory);

module.exports = router;
