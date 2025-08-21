import express from 'express';
import * as ctrl from '../controllers/ordersController.js';

const router = express.Router();

router.get('/', ctrl.getAllOrders);
router.get('/:id', ctrl.getOrderById);
router.post('/', ctrl.createOrder);
router.put('/:id', ctrl.updateOrder);
router.delete('/:id', ctrl.deleteOrder);

export default router;
