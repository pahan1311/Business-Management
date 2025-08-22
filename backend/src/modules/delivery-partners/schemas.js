const { z } = require('zod');

const createPartnerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Company name is required'),
    contactPerson: z.string().min(1, 'Contact person name is required'),
    email: z.string().email('Invalid email format'),
    phone: z.string().min(1, 'Phone number is required'),
    address: z.string().min(1, 'Address is required'),
    contractStart: z.string().datetime().or(z.date()),
    contractEnd: z.string().datetime().or(z.date()),
    areasCovered: z.array(z.string()),
    status: z.enum(['active', 'inactive']).optional().default('active')
  })
});

const updatePartnerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Company name is required').optional(),
    contactPerson: z.string().min(1, 'Contact person name is required').optional(),
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().min(1, 'Phone number is required').optional(),
    address: z.string().min(1, 'Address is required').optional(),
    contractStart: z.string().datetime().or(z.date()).optional(),
    contractEnd: z.string().datetime().or(z.date()).optional(),
    areasCovered: z.array(z.string()).optional(),
    status: z.enum(['active', 'inactive']).optional()
  })
});

const getPartnersSchema = z.object({
  query: z.object({
    status: z.enum(['active', 'inactive', 'all']).optional(),
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    pageSize: z.string().regex(/^\d+$/).transform(Number).optional()
  })
});

module.exports = {
  createPartnerSchema,
  updatePartnerSchema,
  getPartnersSchema
};
