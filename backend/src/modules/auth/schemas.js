const { z } = require('zod');

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  })
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  })
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters')
  })
});

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional(),
    role: z.enum(['CUSTOMER', 'STAFF', 'DELIVERY', 'ADMIN']).default('CUSTOMER')
  })
});

module.exports = {
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  registerSchema
};
