// API routes for QR code generation
const express = require('express');
const router = express.Router();
const qrCodeController = require('../controllers/qrCodeController');
const { protect } = require('../middleware/auth');

// Generate QR code
router.post('/generate', protect, qrCodeController.generateQRCode);

// Lookup delivery/order info from QR code data
router.get('/lookup/:data', protect, qrCodeController.lookupQRCode);

module.exports = router;
