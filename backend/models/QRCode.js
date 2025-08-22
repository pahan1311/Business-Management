// MongoDB schema for QR code data
const mongoose = require('mongoose');

const QRCodeSchema = new mongoose.Schema({
  // ...fields...
});

module.exports = mongoose.model('QRCode', QRCodeSchema);
