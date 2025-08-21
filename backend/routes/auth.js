import express from 'express';
import { register, login, logout } from '../controllers/authController.js';
import { registerValidators, loginValidators } from '../middleware/validate.js';

const router = express.Router();

router.post('/register', registerValidators, register);
router.post('/login', loginValidators, login);
router.post('/logout',  logout);

export default router;
