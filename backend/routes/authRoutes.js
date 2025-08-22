// API routes for authentication
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Register a new user
router.post('/signup', validate, authController.signup);

// Login user
router.post('/login', validate, authController.login);

// Get user profile (protected route)
router.get('/profile', protect, authController.getUserProfile);

module.exports = router;
