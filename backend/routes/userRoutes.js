// Routes for user management
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

// Restrict all user management routes to admin only
// Temporarily commenting out authentication for debugging
// router.use(protect);
// router.use(admin);

// Get all users with filtering options
router.get('/', userController.getUsers);

// Get users by role
router.get('/role/:role', userController.getUsersByRole);

// Get user by ID
router.get('/:id', userController.getUserById);

// Create new user
router.post('/', userController.createUser);

// Update user
router.put('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;
