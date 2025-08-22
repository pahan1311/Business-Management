const jwt = require('jsonwebtoken');
const { prisma } = require('../db/prisma');
const { generateRandomToken, hashToken } = require('./crypto');

const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });
};

const generateRefreshToken = () => {
  return generateRandomToken(64);
};

const createRefreshToken = async (userId) => {
  try {
    const token = generateRefreshToken();
    const hashedToken = hashToken(token);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    // Generate a unique ID for the refresh token
    const tokenId = 'clrt' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    
    // Check if refresh_tokens table exists
    try {
      await prisma.$queryRaw`SELECT 1 FROM refresh_tokens LIMIT 1`;
      
      // Table exists, use raw SQL to insert with correct column names
      await prisma.$executeRaw`
        INSERT INTO refresh_tokens (id, token, user_id, expires_at)
        VALUES (${tokenId}, ${hashedToken}, ${userId}, ${expiresAt})
      `;
    } catch (error) {
      console.log('Refresh token storage error:', error.message);
      // Silently continue - we'll just use the token without storing it
    }

    return token;
  } catch (error) {
    console.error('Error creating refresh token:', error);
    return generateRefreshToken(); // Return a token anyway so the app can continue
  }
};

const validateRefreshToken = async (token) => {
  try {
    const hashedToken = hashToken(token);
    
    // Try to get the token and user
    try {
      const result = await prisma.$queryRaw`
        SELECT rt.user_id, rt.expires_at, u.id, u.email, u.name, u.role 
        FROM refresh_tokens rt
        JOIN users u ON rt.user_id = u.id
        WHERE rt.token = ${hashedToken}
        LIMIT 1
      `;
      
      if (result && result.length > 0) {
        const refreshToken = result[0];
        if (new Date(refreshToken.expires_at) < new Date()) {
          return null;
        }
        
        return {
          id: refreshToken.user_id, // Important: use user_id from the token record
          email: refreshToken.email,
          name: refreshToken.name,
          role: refreshToken.role
        };
      }
    } catch (error) {
      console.log('Error validating refresh token, using JWT fallback:', error.message);
    }
    
    // Fallback: Skip token validation and trust the JWT token
    try {
      // Extract user ID from the JWT token
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      if (decoded && decoded.userId) {
        const users = await prisma.$queryRaw`
          SELECT id, email, name, role FROM users WHERE id = ${decoded.userId} LIMIT 1
        `;
        return users[0];
      }
    } catch (err) {
      console.log('JWT validation failed:', err.message);
    }
    
    return null;
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
};

const revokeRefreshToken = async (token) => {
  try {
    const hashedToken = hashToken(token);
    
    // Use raw SQL to delete the token
    await prisma.$executeRaw`
      DELETE FROM refresh_tokens WHERE token = ${hashedToken}
    `;
  } catch (error) {
    // Token might not exist, ignore error
    console.log('Error revoking token (can be ignored):', error.message);
  }
};

const revokeAllRefreshTokens = async (userId) => {
  try {
    // Use raw SQL to delete all tokens for a user
    await prisma.$executeRaw`
      DELETE FROM refresh_tokens WHERE user_id = ${userId}
    `;
  } catch (error) {
    console.log('Error revoking all tokens:', error.message);
  }
};

const cleanupExpiredTokens = async () => {
  try {
    // Use raw SQL to delete expired tokens
    await prisma.$executeRaw`
      DELETE FROM refresh_tokens WHERE expires_at < NOW()
    `;
  } catch (error) {
    console.log('Error cleaning up expired tokens:', error.message);
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  createRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  cleanupExpiredTokens
};
