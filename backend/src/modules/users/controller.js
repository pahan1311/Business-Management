const { UserService } = require('./service');
const { logger } = require('../../config/logger');

const userService = new UserService();

class UserController {
  async getUsers(req, res, next) {
    try {
      const result = await userService.getUsers(req.query);
      res.json(result);
    } catch (error) {
      logger.error('Get users error:', error);
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      res.json({ user });
    } catch (error) {
      logger.error('Get user by ID error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }
      
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      
      logger.info(`User created: ${user.email} by ${req.user.email}`);
      
      res.status(201).json({ user });
    } catch (error) {
      logger.error('Create user error:', error);
      
      if (error.message === 'User with this email already exists') {
        return res.status(409).json({
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists'
          }
        });
      }
      
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.updateUser(id, req.body);
      
      logger.info(`User updated: ${user.email} by ${req.user.email}`);
      
      res.json({ user });
    } catch (error) {
      logger.error('Update user error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }
      
      if (error.message === 'User with this email already exists') {
        return res.status(409).json({
          error: {
            code: 'EMAIL_EXISTS',
            message: 'User with this email already exists'
          }
        });
      }
      
      next(error);
    }
  }

  async deactivateUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.deactivateUser(id);
      
      logger.info(`User deactivated: ${user.email} by ${req.user.email}`);
      
      res.json({ user });
    } catch (error) {
      logger.error('Deactivate user error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }
      
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const result = await userService.deleteUser(id);
      
      logger.info(`User deleted: ${id} by ${req.user.email}`);
      
      res.json(result);
    } catch (error) {
      logger.error('Delete user error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }
      
      next(error);
    }
  }
}

module.exports = { UserController };
