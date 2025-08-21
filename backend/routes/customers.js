import express from 'express';
import * as ctrl from '../controllers/customersController.js';

const router = express.Router();

router.get('/', ctrl.getAllCustomers);
router.get('/:id', ctrl.getCustomerById);
router.post('/', ctrl.createCustomer);
router.put('/:id', ctrl.updateCustomer);
router.delete('/:id', ctrl.deleteCustomer);

export default router;
