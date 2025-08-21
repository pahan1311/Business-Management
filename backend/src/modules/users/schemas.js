const { z } = require('zod');

const userRoles = ['ADMIN', 'STAFF', 'DELIVERY', 'CUSTOMER'];

const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required'),
    phone: z.string().optional(),
    role: z.enum(userRoles, { required_error: 'Role is required' })
  })
});

const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    name: z.string().min(1, 'Name is required').optional(),
    phone: z.string().optional(),
    role: z.enum(userRoles).optional(),
    isActive: z.boolean().optional()
  })
});

const getUsersSchema = z.object({
  query: z.object({
    role: z.enum(userRoles).optional(),
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    pageSize: z.string().regex(/^\d+$/).transform(Number).optional()
  })
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  getUsersSchema
};
