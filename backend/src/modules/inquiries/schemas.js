const { z } = require('zod');

const inquiryTypes = ['GENERAL', 'ORDER', 'PRODUCT', 'DELIVERY', 'OTHER'];
const inquiryStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const priorityLevels = ['HIGH', 'NORMAL', 'LOW'];

// Base schema for inquiry creation
const createInquirySchema = z.object({
  subject: z.string().min(3).max(200),
  message: z.string().min(5).max(5000),
  type: z.enum(inquiryTypes),
  priority: z.enum(priorityLevels).default('NORMAL'),
  customerId: z.string().uuid().optional(),
  orderNumber: z.string().optional(),
  attachments: z.array(z.string().url()).optional()
});

// Schema for customer-created inquiries - customerId is derived from auth
const customerCreateInquirySchema = createInquirySchema.omit({ customerId: true });

// Schema for admin/staff-created inquiries
const adminCreateInquirySchema = createInquirySchema;

// Schema for updating inquiries
const updateInquirySchema = z.object({
  subject: z.string().min(3).max(200).optional(),
  message: z.string().min(5).max(5000).optional(),
  status: z.enum(inquiryStatuses).optional(),
  type: z.enum(inquiryTypes).optional(),
  priority: z.enum(priorityLevels).optional(),
  assignedToId: z.string().uuid().optional().nullable(),
  attachments: z.array(z.string().url()).optional(),
  notes: z.string().optional()
});

// Schema for inquiry replies
const replySchema = z.object({
  message: z.string().min(1).max(5000),
  attachments: z.array(z.string().url()).optional(),
  isInternal: z.boolean().default(false)
});

// Schema for query parameters
const inquiryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum([...inquiryStatuses, 'ALL']).optional(),
  type: z.enum([...inquiryTypes, 'ALL']).optional(),
  priority: z.enum([...priorityLevels, 'ALL']).optional(),
  customerId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().optional(),
  orderBy: z.enum(['createdAt', 'updatedAt', 'status', 'priority']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  unassigned: z.enum(['true', 'false']).transform(val => val === 'true').optional()
});

module.exports = {
  createInquirySchema,
  customerCreateInquirySchema,
  adminCreateInquirySchema,
  updateInquirySchema,
  replySchema,
  inquiryQuerySchema,
  inquiryTypes,
  inquiryStatuses,
  priorityLevels
};
