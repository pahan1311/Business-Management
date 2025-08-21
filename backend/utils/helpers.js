/**
 * Helper Utilities
 */

const crypto = require('crypto');
const path = require('path');
const moment = require('moment');

/**
 * Generate a random string of specified length
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a random number within a range
 */
const generateRandomNumber = (min = 1000, max = 9999) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Format currency amount
 */
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format date
 */
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return moment(date).format(format);
};

/**
 * Calculate time difference
 */
const getTimeDifference = (startDate, endDate = new Date()) => {
  return moment(endDate).diff(moment(startDate), 'minutes');
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

/**
 * Generate slug from string
 */
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * Sanitize filename
 */
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
};

/**
 * Get file extension
 */
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase().substring(1);
};

/**
 * Check if file type is allowed
 */
const isAllowedFileType = (filename, allowedTypes) => {
  const extension = getFileExtension(filename);
  return allowedTypes.includes(extension);
};

/**
 * Generate unique filename
 */
const generateUniqueFilename = (originalFilename) => {
  const timestamp = Date.now();
  const random = generateRandomString(8);
  const extension = path.extname(originalFilename);
  const name = path.basename(originalFilename, extension);
  const safeName = sanitizeFilename(name);
  
  return `${safeName}_${timestamp}_${random}${extension}`;
};

/**
 * Capitalize first letter of each word
 */
const capitalizeWords = (str) => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Generate pagination metadata
 */
const generatePaginationMeta = (count, page, limit) => {
  const totalPages = Math.ceil(count / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalItems: count,
    itemsPerPage: limit,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null,
  };
};

/**
 * Generate order number
 */
const generateOrderNumber = (prefix = 'ORD') => {
  const timestamp = Date.now().toString().slice(-8);
  const random = generateRandomNumber(100, 999);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Generate QR code data
 */
const generateQRData = (type, id, additionalData = {}) => {
  return JSON.stringify({
    type,
    id,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
};

/**
 * Parse QR code data
 */
const parseQRData = (qrData) => {
  try {
    return JSON.parse(qrData);
  } catch (error) {
    return null;
  }
};

/**
 * Calculate delivery distance (placeholder implementation)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

/**
 * Estimate delivery time based on distance
 */
const estimateDeliveryTime = (distance) => {
  // Assume average speed of 30 km/h and add buffer time
  const travelTime = (distance / 30) * 60; // in minutes
  const bufferTime = 30; // 30 minutes buffer
  return Math.ceil(travelTime + bufferTime);
};

/**
 * Clean object by removing null/undefined values
 */
const cleanObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value != null)
  );
};

/**
 * Deep clone object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Generate API response format
 */
const formatResponse = (data, message = 'Success', meta = null) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    data
  };
  
  if (meta !== null) {
    response.meta = meta;
  }
  
  return response;
};

/**
 * Generate pagination data
 */
const getPaginationData = (totalCount, currentPage, limit) => {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNext = currentPage < totalPages;
  const hasPrevious = currentPage > 1;
  
  return {
    currentPage: parseInt(currentPage),
    totalPages,
    totalCount,
    limit: parseInt(limit),
    hasNext,
    hasPrevious
  };
};

module.exports = {
  generateRandomString,
  generateRandomNumber,
  formatCurrency,
  formatDate,
  getTimeDifference,
  isValidEmail,
  isValidPhone,
  generateSlug,
  sanitizeFilename,
  getFileExtension,
  isAllowedFileType,
  generateUniqueFilename,
  capitalizeWords,
  generatePaginationMeta,
  generateOrderNumber,
  generateQRData,
  parseQRData,
  calculateDistance,
  estimateDeliveryTime,
  cleanObject,
  deepClone,
  formatResponse,
  getPaginationData,
};
