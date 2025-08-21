/**
 * Authentication Controller
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Customer } = require('../models');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES, USER_ROLES, USER_STATUS, RESPONSE_MESSAGES } = require('../utils/constants');
const { formatResponse } = require('../utils/helpers');
const authConfig = require('../config/auth');
const logger = require('../utils/logger');

/**
 * Generate JWT tokens
 */
const generateTokens = (userId) => {
  const payload = { userId, type: 'access' };
  
  const accessToken = jwt.sign(payload, authConfig.jwt.secret, {
    expiresIn: authConfig.jwt.expiresIn,
  });

  const refreshPayload = { userId, type: 'refresh' };
  const refreshToken = jwt.sign(refreshPayload, authConfig.jwt.refreshSecret, {
    expiresIn: authConfig.jwt.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

/**
 * Set authentication cookies
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

/**
 * Register new user
 */
const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, phone, role = USER_ROLES.CUSTOMER, address } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return next(new AppError(
      'User with this email already exists',
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.DUPLICATE_RESOURCE
    ));
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    role,
    address,
    status: USER_STATUS.ACTIVE,
  });

  // If registering as customer, create customer profile
  if (role === USER_ROLES.CUSTOMER) {
    await Customer.create({
      userId: user.id,
      firstName,
      lastName,
      email,
      phone,
      address,
      status: USER_STATUS.ACTIVE,
    });
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Set cookies
  setAuthCookies(res, accessToken, refreshToken);

  // Update last login
  await user.update({ lastLogin: new Date() });

  logger.info(`User registered successfully: ${email}`);

  res.status(HTTP_STATUS.CREATED).json(formatResponse(
    true,
    'User registered successfully',
    {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    }
  ));
});

/**
 * Login user
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user with password
  const user = await User.scope('withPassword').findOne({
    where: { email },
    include: [
      {
        association: 'customerProfile',
        required: false,
      }
    ]
  });

  if (!user) {
    return next(new AppError(
      'Invalid email or password',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTHENTICATION_ERROR
    ));
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    logger.warn(`Failed login attempt for email: ${email}`);
    return next(new AppError(
      'Invalid email or password',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTHENTICATION_ERROR
    ));
  }

  // Check if user is active
  if (!user.isActive()) {
    return next(new AppError(
      'Account is deactivated. Please contact support',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTHORIZATION_ERROR
    ));
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Set cookies
  setAuthCookies(res, accessToken, refreshToken);

  // Update last login
  await user.update({ lastLogin: new Date() });

  logger.info(`User logged in successfully: ${email}`);

  res.json(formatResponse(
    true,
    'Login successful',
    {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    }
  ));
});

/**
 * Logout user
 */
const logout = asyncHandler(async (req, res) => {
  // Clear cookies
  res.clearCookie('token');
  res.clearCookie('refreshToken');

  logger.info(`User logged out: ${req.user.email}`);

  res.json(formatResponse(
    true,
    'Logout successful'
  ));
});

/**
 * Refresh access token
 */
const refreshToken = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return next(new AppError(
      'Refresh token not provided',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTHENTICATION_ERROR
    ));
  }

  try {
    const decoded = jwt.verify(refreshToken, authConfig.jwt.refreshSecret);
    
    if (decoded.type !== 'refresh') {
      return next(new AppError(
        'Invalid refresh token',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.AUTHENTICATION_ERROR
      ));
    }

    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive()) {
      return next(new AppError(
        'User not found or inactive',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.AUTHENTICATION_ERROR
      ));
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

    // Set new cookies
    setAuthCookies(res, accessToken, newRefreshToken);

    res.json(formatResponse(
      true,
      'Token refreshed successfully',
      {
        accessToken,
        refreshToken: newRefreshToken,
      }
    ));
  } catch (error) {
    logger.error('Token refresh failed:', error);
    return next(new AppError(
      'Invalid refresh token',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTHENTICATION_ERROR
    ));
  }
});

/**
 * Get current user
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  res.json(formatResponse(
    true,
    'User data retrieved successfully',
    {
      user: req.user.toSafeObject(),
    }
  ));
});

/**
 * Update user profile
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, phone, address } = req.body;
  const user = req.user;

  // Update user
  await user.update({
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(phone && { phone }),
    ...(address && { address }),
  });

  // Update customer profile if exists
  if (user.customerProfile) {
    await user.customerProfile.update({
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone && { phone }),
      ...(address && { address }),
    });
  }

  logger.info(`Profile updated for user: ${user.email}`);

  res.json(formatResponse(
    true,
    'Profile updated successfully',
    {
      user: user.toSafeObject(),
    }
  ));
});

/**
 * Change password
 */
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.scope('withPassword').findByPk(req.user.id);

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return next(new AppError(
      'Current password is incorrect',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    ));
  }

  // Update password
  await user.update({ password: newPassword });

  logger.info(`Password changed for user: ${user.email}`);

  res.json(formatResponse(
    true,
    'Password changed successfully'
  ));
});

/**
 * Forgot password
 */
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    // Don't reveal if email exists or not
    return res.json(formatResponse(
      true,
      'If the email exists, a password reset link will be sent'
    ));
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + authConfig.passwordReset.tokenExpire);

  // Save reset token
  await user.update({
    resetPasswordToken: resetToken,
    resetPasswordExpires: resetTokenExpiry,
  });

  // TODO: Send email with reset link
  // For now, just log it
  logger.info(`Password reset requested for user: ${email}, token: ${resetToken}`);

  res.json(formatResponse(
    true,
    'If the email exists, a password reset link will be sent'
  ));
});

/**
 * Reset password
 */
const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body;

  const user = await User.scope('withPassword').findOne({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: {
        [require('sequelize').Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    return next(new AppError(
      'Password reset token is invalid or has expired',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    ));
  }

  // Update password and clear reset token
  await user.update({
    password,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  });

  logger.info(`Password reset completed for user: ${user.email}`);

  res.json(formatResponse(
    true,
    'Password reset successful'
  ));
});

/**
 * Verify email
 */
const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  // TODO: Implement email verification logic
  // For now, just return success
  
  res.json(formatResponse(
    true,
    'Email verified successfully'
  ));
});

/**
 * Resend verification email
 */
const resendVerification = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.json(formatResponse(
      true,
      'If the email exists, a verification link will be sent'
    ));
  }

  // TODO: Send verification email
  logger.info(`Verification email resent for user: ${email}`);

  res.json(formatResponse(
    true,
    'If the email exists, a verification link will be sent'
  ));
});

/**
 * Deactivate account
 */
const deactivateAccount = asyncHandler(async (req, res) => {
  const user = req.user;

  await user.update({ status: USER_STATUS.INACTIVE });

  // Clear cookies
  res.clearCookie('token');
  res.clearCookie('refreshToken');

  logger.info(`Account deactivated for user: ${user.email}`);

  res.json(formatResponse(
    true,
    'Account deactivated successfully'
  ));
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  deactivateAccount,
};
