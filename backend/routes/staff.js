import express from 'express';
import * as ctrl from '../controllers/staffController.js';

const router = express.Router();

router.get('/', ctrl.getAllStaff);
router.get('/:id', ctrl.getStaffById);
router.post('/', ctrl.createStaff);
router.put('/:id', ctrl.updateStaff);
router.delete('/:id', ctrl.deleteStaff);

export default router;
