const { AuthService } = require('./service');
const { logger } = require('../../config/logger');

const authService = new AuthService();

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      const result = await authService.login(email, password);
      
      logger.info(`User logged in: ${email}`);
      
      res.json(result);
    } catch (error) {
      logger.error('Login error:', error);
      
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }
      
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      const result = await authService.refreshToken(refreshToken);
      
      res.json(result);
    } catch (error) {
      logger.error('Token refresh error:', error);
      
      if (error.message === 'Invalid refresh token') {
        return res.status(401).json({
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Invalid or expired refresh token'
          }
        });
      }
      
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      await authService.logout(refreshToken);
      
      logger.info(`User logged out: ${req.user?.email}`);
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error:', error);
      next(error);
    }
  }

  async logoutAll(req, res, next) {
    try {
      await authService.logoutAll(req.user.id);
      
      logger.info(`User logged out from all devices: ${req.user.email}`);
      
      res.json({ message: 'Logged out from all devices successfully' });
    } catch (error) {
      logger.error('Logout all error:', error);
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const result = await authService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );
      
      logger.info(`Password changed for user: ${req.user.email}`);
      
      res.json(result);
    } catch (error) {
      logger.error('Change password error:', error);
      
      if (error.message === 'Invalid current password') {
        return res.status(400).json({
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Current password is incorrect'
          }
        });
      }
      
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);
      
      res.json({ user });
    } catch (error) {
      logger.error('Get profile error:', error);
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const userData = req.body;
      
      console.log('Registration request data:', userData);
      
      // This is a simplified implementation - in a real app, you'd want more validation
      const result = await authService.register(userData);
      
      logger.info(`User registered: ${userData.email}`);
      
      res.status(201).json(result);
    } catch (error) {
      logger.error('Register error:', error);
      
      if (error.message === 'User already exists') {
        return res.status(409).json({
          error: {
            code: 'USER_EXISTS',
            message: 'A user with this email already exists'
          }
        });
      }
      
      next(error);
    }
  }
}

module.exports = { AuthController };
