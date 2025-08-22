// Utility for generating QR codes
const QRCode = require('qrcode');

exports.generate = async (text) => {
  try {
    return await QRCode.toDataURL(text);
  } catch (err) {
    throw err;
  }
};
