import express from 'express';
import * as ctrl from '../controllers/inquiriesController.js';

const router = express.Router();

router.get('/', ctrl.getAllInquiries);
router.get('/:id', ctrl.getInquiryById);
router.post('/', ctrl.createInquiry);
router.put('/:id', ctrl.updateInquiry);
router.delete('/:id', ctrl.deleteInquiry);

export default router;
