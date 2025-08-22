const { prisma } = require('../../db/prisma');
const { comparePassword, hashPassword } = require('../../utils/crypto');
const { 
  generateAccessToken, 
  createRefreshToken, 
  validateRefreshToken, 
  revokeRefreshToken,
  revokeAllRefreshTokens
} = require('../../utils/tokens');

class AuthService {
  async login(email, password) {
    try {
      // Find user by email using raw SQL
      const users = await prisma.$queryRaw`
        SELECT id, email, password, name, role, is_active FROM users WHERE email = ${email} LIMIT 1
      `;
      
      const user = users[0];

      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      // Check if user is active
      if (user.is_active !== 1) {
        throw new Error('Account is inactive');
      }
      
      // Log for debugging
      console.log('Found user:', { id: user.id, email: user.email, role: user.role });
      
      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      const refreshToken = await createRefreshToken(user.id);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      const user = await validateRefreshToken(refreshToken);
      
      if (!user) {
        throw new Error('Invalid refresh token');
      }
      
      // Revoke the old refresh token
      try {
        await revokeRefreshToken(refreshToken);
      } catch (err) {
        // Ignore errors during revocation
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      const newRefreshToken = await createRefreshToken(user.id);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  async logout(refreshToken) {
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
  }

  async logoutAll(userId) {
    await revokeAllRefreshTokens(userId);
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user with password using raw SQL
      const users = await prisma.$queryRaw`
        SELECT id, password FROM users WHERE id = ${userId} LIMIT 1
      `;
      
      const user = users[0];

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Invalid current password');
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password with raw SQL
      await prisma.$executeRaw`
        UPDATE users SET password = ${hashedNewPassword}, updated_at = NOW()
        WHERE id = ${userId}
      `;

      // Revoke all refresh tokens to force re-login
      await revokeAllRefreshTokens(userId);

      return { message: 'Password changed successfully' };
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  async getProfile(userId) {
    try {
      // Use raw SQL to get user profile with snake_case column names
      const users = await prisma.$queryRaw`
        SELECT id, email, name, phone, role, is_active, created_at
        FROM users
        WHERE id = ${userId}
        LIMIT 1
      `;

      const user = users[0];

      if (!user) {
        throw new Error('User not found');
      }

      // Transform snake_case to camelCase for the response
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active === 1,
        createdAt: user.created_at
      };
    } catch (error) {
      console.error('Get profile error:', error);
      throw new Error('Failed to retrieve user profile');
    }
  }

  async register(userData) {
    try {
      console.log('Raw registration request:', userData);
      console.log('Registration request data:', userData);
      
      // Check if user exists using a direct SQL query that doesn't rely on schema
      const existingUser = await prisma.$queryRaw`
        SELECT email FROM users WHERE email = ${userData.email} LIMIT 1
      `;

      if (existingUser && existingUser.length > 0) {
        throw new Error('User already exists');
      }

      // Hash the password
      const hashedPassword = await hashPassword(userData.password);

      // Create the user with raw SQL that matches your actual table structure
      // Generate a unique ID that matches your format from the schema (cl + random characters)
      const userId = 'cl' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      
      await prisma.$executeRaw`
        INSERT INTO users (id, name, email, password, phone, role, is_active)
        VALUES (${userId}, ${userData.name}, ${userData.email}, ${hashedPassword}, ${userData.phone}, ${userData.role || 'CUSTOMER'}, 1)
      `;
      
      // Get the created user
      const createdUser = await prisma.$queryRaw`
        SELECT id, email, name, role FROM users WHERE email = ${userData.email} LIMIT 1
      `;
      
      // Extract the user object from the array
      const newUser = createdUser[0];
      
      // Generate tokens
      const accessToken = generateAccessToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role
      });

      const refreshToken = await createRefreshToken(newUser.id);

      console.log('User registered:', newUser.email);
      
      return {
        accessToken,
        refreshToken,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      };
    } catch (error) {
      // Log the error for debugging
      console.error('Registration error:', error);
      throw error;
    }
  }
}

module.exports = { AuthService };

module.exports = { AuthService };
