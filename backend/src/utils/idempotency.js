const { nanoid } = require('nanoid');

// Generate unique order numbers
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = nanoid(4).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Generate tracking numbers for deliveries
const generateTrackingNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = nanoid(6).toUpperCase();
  return `TRK-${timestamp}-${random}`;
};

// Simple idempotency key validation
const validateIdempotencyKey = (key) => {
  if (!key) return false;
  // Should be at least 16 characters and contain only alphanumeric chars and hyphens
  return /^[a-zA-Z0-9-]{16,}$/.test(key);
};

// Generate idempotency key
const generateIdempotencyKey = () => {
  return nanoid(32);
};

module.exports = {
  generateOrderNumber,
  generateTrackingNumber,
  validateIdempotencyKey,
  generateIdempotencyKey
};
