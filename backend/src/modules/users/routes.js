const express = require('express');
const { UserController } = require('./controller');
const { authGuard } = require('../../middlewares/authGuard');
const { rbacGuard } = require('../../middlewares/rbacGuard');
const { zodValidate } = require('../../middlewares/zodValidate');
const { 
  createUserSchema, 
  updateUserSchema, 
  getUsersSchema 
} = require('./schemas');

const router = express.Router();
const userController = new UserController();

// All routes require authentication and admin role
router.use(authGuard);
router.use(rbacGuard(['ADMIN']));

router.get('/', zodValidate(getUsersSchema), userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', zodValidate(createUserSchema), userController.createUser);
router.patch('/:id', zodValidate(updateUserSchema), userController.updateUser);
router.patch('/:id/deactivate', userController.deactivateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
