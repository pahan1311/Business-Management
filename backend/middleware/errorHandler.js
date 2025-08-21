/**
 * Error Handling Middleware
 */

const logger = require('../utils/logger');
const { formatResponse } = require('../utils/helpers');
const { HTTP_STATUS, RESPONSE_MESSAGES, ERROR_CODES } = require('../utils/constants');

/**
 * Custom Application Error Class
 */
class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Handle Sequelize validation errors
 */
const handleSequelizeValidationError = (error) => {
  const errors = error.errors.map(err => ({
    field: err.path,
    message: err.message,
    value: err.value,
  }));

  return new AppError(
    'Validation error',
    HTTP_STATUS.BAD_REQUEST,
    ERROR_CODES.VALIDATION_ERROR,
    errors
  );
};

/**
 * Handle Sequelize unique constraint error
 */
const handleSequelizeUniqueConstraintError = (error) => {
  const field = error.errors[0].path;
  const value = error.errors[0].value;
  
  return new AppError(
    `${field} '${value}' already exists`,
    HTTP_STATUS.CONFLICT,
    ERROR_CODES.DUPLICATE_RESOURCE
  );
};

/**
 * Handle Sequelize foreign key constraint error
 */
const handleSequelizeForeignKeyConstraintError = (error) => {
  return new AppError(
    'Referenced resource does not exist',
    HTTP_STATUS.BAD_REQUEST,
    ERROR_CODES.BUSINESS_RULE_VIOLATION
  );
};

/**
 * Handle JWT errors
 */
const handleJWTError = (error) => {
  if (error.name === 'TokenExpiredError') {
    return new AppError(
      'Token has expired',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTHENTICATION_ERROR
    );
  }
  
  if (error.name === 'JsonWebTokenError') {
    return new AppError(
      'Invalid token',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTHENTICATION_ERROR
    );
  }

  return new AppError(
    'Authentication failed',
    HTTP_STATUS.UNAUTHORIZED,
    ERROR_CODES.AUTHENTICATION_ERROR
  );
};

/**
 * Handle multer file upload errors
 */
const handleMulterError = (error) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new AppError(
      'File size too large',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return new AppError(
      'Too many files uploaded',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError(
      'Unexpected file field',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  return new AppError(
    'File upload error',
    HTTP_STATUS.BAD_REQUEST,
    ERROR_CODES.VALIDATION_ERROR
  );
};

/**
 * Send error response in development
 */
const sendErrorDev = (err, req, res) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      message: err.message,
      errorCode: err.errorCode,
      statusCode: err.statusCode,
      status: err.status,
      details: err.details,
      stack: err.stack,
    },
  });
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, req, res) => {
  // Log error details
  logger.error('Error occurred:', {
    error: err.message,
    errorCode: err.errorCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Operational errors: send message to client
  if (err.isOperational) {
    const response = formatResponse(
      false,
      err.message,
      null,
      {
        errorCode: err.errorCode,
        ...(err.details && { details: err.details }),
      }
    );

    return res.status(err.statusCode).json(response);
  }

  // Programming or unknown error: don't leak error details
  logger.error('Unexpected error:', err);

  const response = formatResponse(
    false,
    RESPONSE_MESSAGES.SERVER_ERROR
  );

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
};

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Handle specific error types
  if (err.name === 'SequelizeValidationError') {
    error = handleSequelizeValidationError(err);
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    error = handleSequelizeUniqueConstraintError(err);
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = handleSequelizeForeignKeyConstraintError(err);
  } else if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
    error = handleJWTError(err);
  } else if (err.name === 'MulterError') {
    error = handleMulterError(err);
  } else if (err.name === 'CastError') {
    error = new AppError(
      'Resource not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  // Send error response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

/**
 * Handle 404 errors for undefined routes
 */
const notFound = (req, res, next) => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    HTTP_STATUS.NOT_FOUND,
    ERROR_CODES.RESOURCE_NOT_FOUND
  );
  
  next(error);
};

/**
 * Handle rate limit exceeded errors
 */
const rateLimitHandler = (req, res, next) => {
  const error = new AppError(
    'Too many requests, please try again later',
    HTTP_STATUS.TOO_MANY_REQUESTS,
    ERROR_CODES.RATE_LIMIT_EXCEEDED
  );
  
  next(error);
};

module.exports = {
  AppError,
  asyncHandler,
  errorHandler,
  notFound,
  rateLimitHandler,
};
