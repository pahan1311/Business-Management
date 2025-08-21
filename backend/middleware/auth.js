/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError, asyncHandler } = require('./errorHandler');
const { HTTP_STATUS, ERROR_CODES, USER_ROLES } = require('../utils/constants');
const authConfig = require('../config/auth');
const logger = require('../utils/logger');

/**
 * Verify JWT Token
 */
const verifyToken = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Check for token in cookies
    token = req.cookies.token;
  }

  if (!token) {
    return next(new AppError(
      'Access denied. No token provided',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTHENTICATION_ERROR
    ));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, authConfig.jwt.secret);
    
    // Get user from database
    const user = await User.findByPk(decoded.userId, {
      include: [
        {
          association: 'customerProfile',
          required: false
        }
      ]
    });

    if (!user) {
      return next(new AppError(
        'Token is valid but user no longer exists',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.AUTHENTICATION_ERROR
      ));
    }

    if (!user.isActive()) {
      return next(new AppError(
        'User account is deactivated',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.AUTHENTICATION_ERROR
      ));
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    
    if (error.name === 'TokenExpiredError') {
      return next(new AppError(
        'Token has expired',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.AUTHENTICATION_ERROR
      ));
    }
    
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError(
        'Invalid token',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.AUTHENTICATION_ERROR
      ));
    }

    return next(new AppError(
      'Authentication failed',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTHENTICATION_ERROR
    ));
  }
});

/**
 * Check if user has required role(s)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(
        'Authentication required',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.AUTHENTICATION_ERROR
      ));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(
        'Access denied. Insufficient permissions',
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.AUTHORIZATION_ERROR
      ));
    }

    next();
  };
};

/**
 * Check if user is admin
 */
const requireAdmin = requireRole(USER_ROLES.ADMIN);

/**
 * Check if user is staff or admin
 */
const requireStaffOrAdmin = requireRole(USER_ROLES.STAFF, USER_ROLES.ADMIN);

/**
 * Check if user is customer
 */
const requireCustomer = requireRole(USER_ROLES.CUSTOMER);

/**
 * Check if user is delivery person
 */
const requireDelivery = requireRole(USER_ROLES.DELIVERY);

/**
 * Check if user owns the resource or has admin privileges
 */
const requireOwnershipOrAdmin = (userIdField = 'userId') => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return next(new AppError(
        'Authentication required',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.AUTHENTICATION_ERROR
      ));
    }

    // Admin can access any resource
    if (req.user.isAdmin()) {
      return next();
    }

    // Check ownership
    const resourceUserId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];
    
    if (resourceUserId && parseInt(resourceUserId) === req.user.id) {
      return next();
    }

    // For customer accessing their own data
    if (req.user.isCustomer() && req.user.customerProfile) {
      const customerId = req.params.customerId || req.body.customerId || req.query.customerId;
      if (customerId && parseInt(customerId) === req.user.customerProfile.id) {
        return next();
      }
    }

    return next(new AppError(
      'Access denied. You can only access your own resources',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.AUTHORIZATION_ERROR
    ));
  });
};

/**
 * Optional authentication - doesn't require token but validates if present
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, authConfig.jwt.secret);
      const user = await User.findByPk(decoded.userId, {
        include: [
          {
            association: 'customerProfile',
            required: false
          }
        ]
      });

      if (user && user.isActive()) {
        req.user = user;
      }
    } catch (error) {
      // Silently fail for optional auth
      logger.warn('Optional auth token verification failed:', error.message);
    }
  }

  next();
});

/**
 * Check if user can access specific customer data
 */
const requireCustomerAccess = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError(
      'Authentication required',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTHENTICATION_ERROR
    ));
  }

  // Admin and staff can access any customer data
  if (req.user.isAdmin() || req.user.isStaff()) {
    return next();
  }

  // Customer can only access their own data
  if (req.user.isCustomer() && req.user.customerProfile) {
    const customerId = req.params.customerId || req.params.id;
    if (customerId && parseInt(customerId) === req.user.customerProfile.id) {
      return next();
    }
  }

  return next(new AppError(
    'Access denied. Insufficient permissions',
    HTTP_STATUS.FORBIDDEN,
    ERROR_CODES.AUTHORIZATION_ERROR
  ));
});

/**
 * Rate limiting for sensitive operations
 */
const sensitiveOperationLimit = (windowMs = 15 * 60 * 1000, maxRequests = 5) => {
  const attempts = new Map();

  return (req, res, next) => {
    const identifier = req.user ? req.user.id : req.ip;
    const now = Date.now();
    
    if (!attempts.has(identifier)) {
      attempts.set(identifier, []);
    }

    const userAttempts = attempts.get(identifier);
    
    // Remove old attempts
    const validAttempts = userAttempts.filter(attempt => now - attempt < windowMs);
    
    if (validAttempts.length >= maxRequests) {
      return next(new AppError(
        'Too many attempts. Please try again later',
        HTTP_STATUS.TOO_MANY_REQUESTS,
        ERROR_CODES.RATE_LIMIT_EXCEEDED
      ));
    }

    validAttempts.push(now);
    attempts.set(identifier, validAttempts);
    
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  requireStaffOrAdmin,
  requireCustomer,
  requireDelivery,
  requireOwnershipOrAdmin,
  optionalAuth,
  requireCustomerAccess,
  sensitiveOperationLimit,
};
