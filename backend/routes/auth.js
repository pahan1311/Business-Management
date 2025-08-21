/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, sensitiveOperationLimit } = require('../middleware/auth');
const { validateSchema, userValidation } = require('../utils/validators');

// Public routes
router.post('/register', 
  validateSchema(userValidation.register),
  authController.register
);

router.post('/login',
  validateSchema(userValidation.login),
  sensitiveOperationLimit(15 * 60 * 1000, 5), // 5 attempts per 15 minutes
  authController.login
);

router.post('/forgot-password',
  validateSchema(userValidation.forgotPassword),
  sensitiveOperationLimit(15 * 60 * 1000, 3), // 3 attempts per 15 minutes
  authController.forgotPassword
);

router.post('/reset-password',
  validateSchema(userValidation.resetPassword),
  authController.resetPassword
);

router.post('/verify-email/:token',
  authController.verifyEmail
);

router.post('/resend-verification',
  validateSchema(userValidation.forgotPassword), // Same validation as forgot password
  sensitiveOperationLimit(5 * 60 * 1000, 3), // 3 attempts per 5 minutes
  authController.resendVerification
);

// Protected routes
router.use(verifyToken); // All routes below require authentication

router.post('/logout',
  authController.logout
);

router.post('/refresh-token',
  authController.refreshToken
);

router.get('/me',
  authController.getCurrentUser
);

router.put('/profile',
  validateSchema(userValidation.updateProfile),
  authController.updateProfile
);

router.post('/change-password',
  validateSchema(userValidation.changePassword),
  sensitiveOperationLimit(15 * 60 * 1000, 3), // 3 attempts per 15 minutes
  authController.changePassword
);

router.delete('/deactivate-account',
  sensitiveOperationLimit(60 * 60 * 1000, 1), // 1 attempt per hour
  authController.deactivateAccount
);

module.exports = router;
