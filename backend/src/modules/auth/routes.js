const express = require('express');
const { AuthController } = require('./controller');
const { authGuard } = require('../../middlewares/authGuard');
const { zodValidate } = require('../../middlewares/zodValidate');
const { 
  loginSchema, 
  refreshTokenSchema, 
  changePasswordSchema,
  registerSchema
} = require('./schemas');

const router = express.Router();
const authController = new AuthController();

// Public routes
router.post('/login', zodValidate(loginSchema), authController.login);
router.post('/refresh', zodValidate(refreshTokenSchema), authController.refresh);
router.post('/register', 
  (req, res, next) => {
    console.log('Raw registration request:', req.body);
    next();
  }, 
  zodValidate(registerSchema), 
  authController.register
);

// Protected routes
router.post('/logout', authController.logout);
router.post('/logout-all', authGuard, authController.logoutAll);
router.post('/change-password', authGuard, zodValidate(changePasswordSchema), authController.changePassword);
router.get('/me', authGuard, authController.me);

module.exports = router;
