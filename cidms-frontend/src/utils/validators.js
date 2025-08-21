import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.object({
    line1: z.string().min(5, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    postalCode: z.string().min(5, 'Postal code is required'),
    country: z.string().min(2, 'Country is required'),
  }),
});

export const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(2, 'Product name is required'),
  description: z.string().optional(),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  reorderPoint: z.number().min(0, 'Reorder point must be non-negative'),
  category: z.string().optional(),
});

export const orderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  address: z.object({
    line1: z.string().min(5, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    postalCode: z.string().min(5, 'Postal code is required'),
    country: z.string().min(2, 'Country is required'),
  }),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  })).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

export const stockMovementSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  type: z.enum(['IN', 'OUT', 'ADJUST'], 'Invalid movement type'),
  quantity: z.number().min(1, 'Quantity must be greater than 0'),
  reason: z.string().min(5, 'Reason is required'),
});

export const taskSchema = z.object({
  title: z.string().min(5, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  assigneeId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH'], 'Invalid priority'),
  dueDate: z.string().optional(),
  orderId: z.string().optional(),
});

export const inquirySchema = z.object({
  type: z.enum(['GENERAL', 'ORDER', 'DELIVERY', 'PRODUCT', 'COMPLAINT'], 'Invalid inquiry type'),
  subject: z.string().min(5, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  orderId: z.string().optional(),
});

export const deliveryIssueSchema = z.object({
  type: z.enum(['DAMAGE', 'MISSING', 'WRONG_ADDRESS', 'CUSTOMER_UNAVAILABLE', 'OTHER'], 'Invalid issue type'),
  message: z.string().min(5, 'Message is required'),
  photo: z.instanceof(File).optional(),
});

export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  role: z.enum(['ADMIN', 'STAFF', 'DELIVERY', 'CUSTOMER'], 'Invalid role'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});
