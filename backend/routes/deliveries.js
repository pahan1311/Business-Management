import express from 'express';
import * as ctrl from '../controllers/deliveriesController.js';

const router = express.Router();

router.get('/', ctrl.getAllDeliveries);
router.get('/:id', ctrl.getDeliveryById);
router.post('/', ctrl.createDelivery);
router.put('/:id', ctrl.updateDelivery);
router.delete('/:id', ctrl.deleteDelivery);

export default router;
