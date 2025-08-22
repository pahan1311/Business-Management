// API routes for staff management
const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { protect } = require('../middleware/auth');

// Define routes here
router.get('/', protect, staffController.getStaff);
router.get('/available', protect, staffController.getAvailableStaff);
router.get('/:id', protect, staffController.getStaffById);
router.post('/', protect, staffController.createStaff);
router.put('/:id', protect, staffController.updateStaff);
router.delete('/:id', protect, staffController.deleteStaff);

module.exports = router;
