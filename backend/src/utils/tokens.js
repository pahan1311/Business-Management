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
  const token = generateRefreshToken();
  const hashedToken = hashToken(token);
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: {
      token: hashedToken,
      userId,
      expiresAt
    }
  });

  return token;
};

const validateRefreshToken = async (token) => {
  const hashedToken = hashToken(token);
  
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token: hashedToken },
    include: { user: true }
  });

  if (!refreshToken || refreshToken.expiresAt < new Date()) {
    return null;
  }

  return refreshToken.user;
};

const revokeRefreshToken = async (token) => {
  const hashedToken = hashToken(token);
  
  await prisma.refreshToken.delete({
    where: { token: hashedToken }
  }).catch(() => {
    // Token might not exist, ignore error
  });
};

const revokeAllRefreshTokens = async (userId) => {
  await prisma.refreshToken.deleteMany({
    where: { userId }
  });
};

const cleanupExpiredTokens = async () => {
  await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });
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
