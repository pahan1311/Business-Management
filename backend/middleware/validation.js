/**
 * Validation Middleware
 */

const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../utils/constants');

/**
 * Handle validation errors from express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    return next(new AppError(
      'Validation failed',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      validationErrors
    ));
  }

  next();
};

/**
 * Validate request body size
 */
const validateRequestSize = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.get('content-length');
    
    if (contentLength && parseInt(contentLength) > parseSize(maxSize)) {
      return next(new AppError(
        `Request body too large. Maximum size allowed: ${maxSize}`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      ));
    }

    next();
  };
};

/**
 * Validate content type
 */
const validateContentType = (...allowedTypes) => {
  return (req, res, next) => {
    const contentType = req.get('content-type');
    
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      return next(new AppError(
        `Invalid content type. Allowed types: ${allowedTypes.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      ));
    }

    next();
  };
};

/**
 * Parse size string to bytes
 */
function parseSize(size) {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) {
    throw new Error('Invalid size format');
  }

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';

  return value * units[unit];
}

/**
 * Sanitize request data
 */
const sanitizeRequest = (req, res, next) => {
  // Remove any potential XSS attempts from string fields
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  };

  const sanitizeObject = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return sanitizeString(obj);
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  if (isNaN(pageNum) || pageNum < 1) {
    return next(new AppError(
      'Page must be a positive integer',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    ));
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return next(new AppError(
      'Limit must be a positive integer between 1 and 100',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    ));
  }

  req.pagination = {
    page: pageNum,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum,
  };

  next();
};

/**
 * Validate ID parameter
 */
const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || isNaN(parseInt(id, 10)) || parseInt(id, 10) < 1) {
      return next(new AppError(
        `Invalid ${paramName}. Must be a positive integer`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      ));
    }

    req.params[paramName] = parseInt(id, 10);
    next();
  };
};

module.exports = {
  handleValidationErrors,
  validateRequestSize,
  validateContentType,
  sanitizeRequest,
  validatePagination,
  validateId,
};
