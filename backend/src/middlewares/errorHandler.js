const { logger } = require('../config/logger');

const errorHandler = (error, req, res, next) => {
  const requestId = req.requestId;
  
  // Log the error
  logger.error('Request error:', {
    requestId,
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Prisma errors
  if (error.code === 'P2002') {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'Resource already exists',
        requestId
      }
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        requestId
      }
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
        requestId
      }
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token expired',
        requestId
      }
    });
  }

  // Custom application errors
  if (error.code) {
    return res.status(error.statusCode || 400).json({
      error: {
        code: error.code,
        message: error.message,
        requestId
      }
    });
  }

  // Generic server error
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      requestId
    }
  });
};

module.exports = { errorHandler };
