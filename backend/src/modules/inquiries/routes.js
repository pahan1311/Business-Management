const express = require('express');
const { authGuard } = require('../../middlewares/authGuard');
const { rbacGuard } = require('../../middlewares/rbacGuard');
const { zodValidate } = require('../../middlewares/zodValidate');
const { InquiryController } = require('./controller');
const { 
  createInquirySchema, 
  updateInquirySchema, 
  inquiryQuerySchema,
  replySchema 
} = require('./schemas');

const router = express.Router();
const inquiryController = new InquiryController();

/**
 * @route GET /api/inquiries
 * @desc Get all inquiries with filtering and pagination
 * @access Private - Admin, Staff, Customer (own inquiries only)
 */
router.get('/',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF', 'CUSTOMER']),
  zodValidate('query', inquiryQuerySchema),
  (req, res, next) => inquiryController.getInquiries(req, res, next)
);

/**
 * @route GET /api/inquiries/:id
 * @desc Get a single inquiry by ID
 * @access Private - Admin, Staff, Customer (own inquiries only)
 */
router.get('/:id',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF', 'CUSTOMER']),
  (req, res, next) => inquiryController.getInquiryById(req, res, next)
);

/**
 * @route POST /api/inquiries
 * @desc Create a new inquiry
 * @access Private - Admin, Staff, Customer
 */
router.post('/',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF', 'CUSTOMER']),
  zodValidate('body', createInquirySchema),
  (req, res, next) => inquiryController.createInquiry(req, res, next)
);

/**
 * @route PUT /api/inquiries/:id
 * @desc Update an inquiry
 * @access Private - Admin, Staff, Customer (own inquiries only)
 */
router.put('/:id',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF', 'CUSTOMER']),
  zodValidate('body', updateInquirySchema),
  (req, res, next) => inquiryController.updateInquiry(req, res, next)
);

/**
 * @route DELETE /api/inquiries/:id
 * @desc Delete an inquiry
 * @access Private - Admin only
 */
router.delete('/:id',
  authGuard,
  rbacGuard(['ADMIN']),
  (req, res, next) => inquiryController.deleteInquiry(req, res, next)
);

/**
 * @route POST /api/inquiries/:id/replies
 * @desc Add a reply to an inquiry
 * @access Private - Admin, Staff, Customer (own inquiries only)
 */
router.post('/:id/replies',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF', 'CUSTOMER']),
  zodValidate('body', replySchema),
  (req, res, next) => inquiryController.addReply(req, res, next)
);

/**
 * @route GET /api/inquiries/:id/replies
 * @desc Get all replies for an inquiry
 * @access Private - Admin, Staff, Customer (own inquiries only)
 */
router.get('/:id/replies',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF', 'CUSTOMER']),
  (req, res, next) => inquiryController.getReplies(req, res, next)
);

module.exports = router;
