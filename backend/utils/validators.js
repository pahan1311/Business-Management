/**
 * Validation Utilities
 */

const Joi = require('joi');
const { REGEX_PATTERNS, USER_ROLES, ORDER_STATUS, DELIVERY_STATUS } = require('./constants');

/**
 * Common validation schemas
 */
const commonSchemas = {
  id: Joi.number().integer().positive().required(),
  email: Joi.string().email().max(255).required(),
  password: Joi.string().pattern(REGEX_PATTERNS.PASSWORD).min(8).max(128).required()
    .messages({
      'string.pattern.base': 'Password must contain at least 8 characters with uppercase, lowercase, number and special character'
    }),
  phone: Joi.string().pattern(REGEX_PATTERNS.PHONE).max(20).required(),
  name: Joi.string().min(2).max(100).trim().required(),
  optionalName: Joi.string().min(2).max(100).trim().optional(),
  description: Joi.string().max(1000).trim().optional(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().max(50).optional(),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
};

/**
 * User validation schemas
 */
const userValidation = {
  register: Joi.object({
    firstName: commonSchemas.name,
    lastName: commonSchemas.name,
    email: commonSchemas.email,
    password: commonSchemas.password,
    phone: commonSchemas.phone,
    role: Joi.string().valid(...Object.values(USER_ROLES)).default(USER_ROLES.CUSTOMER),
    address: Joi.object({
      street: Joi.string().max(255).required(),
      city: Joi.string().max(100).required(),
      state: Joi.string().max(100).required(),
      zipCode: Joi.string().max(20).required(),
      country: Joi.string().max(100).default('USA'),
    }).optional(),
  }),

  login: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().min(1).required(),
  }),

  updateProfile: Joi.object({
    firstName: commonSchemas.optionalName,
    lastName: commonSchemas.optionalName,
    phone: Joi.string().pattern(REGEX_PATTERNS.PHONE).max(20).optional(),
    address: Joi.object({
      street: Joi.string().max(255).optional(),
      city: Joi.string().max(100).optional(),
      state: Joi.string().max(100).optional(),
      zipCode: Joi.string().max(20).optional(),
      country: Joi.string().max(100).optional(),
    }).optional(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().min(1).required(),
    newPassword: commonSchemas.password,
  }),

  forgotPassword: Joi.object({
    email: commonSchemas.email,
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: commonSchemas.password,
  }),
};

/**
 * Customer validation schemas
 */
const customerValidation = {
  create: Joi.object({
    firstName: commonSchemas.name,
    lastName: commonSchemas.name,
    email: commonSchemas.email,
    phone: commonSchemas.phone,
    address: Joi.object({
      street: Joi.string().max(255).required(),
      city: Joi.string().max(100).required(),
      state: Joi.string().max(100).required(),
      zipCode: Joi.string().max(20).required(),
      country: Joi.string().max(100).default('USA'),
    }).required(),
    dateOfBirth: Joi.date().max('now').optional(),
    notes: commonSchemas.description,
  }),

  update: Joi.object({
    firstName: commonSchemas.optionalName,
    lastName: commonSchemas.optionalName,
    email: Joi.string().email().max(255).optional(),
    phone: Joi.string().pattern(REGEX_PATTERNS.PHONE).max(20).optional(),
    address: Joi.object({
      street: Joi.string().max(255).optional(),
      city: Joi.string().max(100).optional(),
      state: Joi.string().max(100).optional(),
      zipCode: Joi.string().max(20).optional(),
      country: Joi.string().max(100).optional(),
    }).optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    notes: commonSchemas.description,
    status: commonSchemas.status,
  }),

  search: Joi.object({
    search: Joi.string().max(100).optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
    page: commonSchemas.page,
    limit: commonSchemas.limit,
    sortBy: commonSchemas.sortBy,
    sortOrder: commonSchemas.sortOrder,
  }),
};

/**
 * Inventory validation schemas
 */
const inventoryValidation = {
  createProduct: Joi.object({
    name: commonSchemas.name,
    description: commonSchemas.description,
    sku: Joi.string().max(50).required(),
    category: Joi.string().max(100).required(),
    price: Joi.number().positive().precision(2).required(),
    cost: Joi.number().positive().precision(2).optional(),
    stockQuantity: Joi.number().integer().min(0).required(),
    minStockLevel: Joi.number().integer().min(0).default(10),
    maxStockLevel: Joi.number().integer().min(0).optional(),
    unit: Joi.string().max(20).default('pcs'),
    weight: Joi.number().positive().optional(),
    dimensions: Joi.object({
      length: Joi.number().positive().optional(),
      width: Joi.number().positive().optional(),
      height: Joi.number().positive().optional(),
    }).optional(),
    images: Joi.array().items(Joi.string()).max(5).optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    status: commonSchemas.status,
  }),

  updateProduct: Joi.object({
    name: commonSchemas.optionalName,
    description: commonSchemas.description,
    category: Joi.string().max(100).optional(),
    price: Joi.number().positive().precision(2).optional(),
    cost: Joi.number().positive().precision(2).optional(),
    minStockLevel: Joi.number().integer().min(0).optional(),
    maxStockLevel: Joi.number().integer().min(0).optional(),
    unit: Joi.string().max(20).optional(),
    weight: Joi.number().positive().optional(),
    dimensions: Joi.object({
      length: Joi.number().positive().optional(),
      width: Joi.number().positive().optional(),
      height: Joi.number().positive().optional(),
    }).optional(),
    images: Joi.array().items(Joi.string()).max(5).optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    status: commonSchemas.status,
  }),

  stockMovement: Joi.object({
    productId: commonSchemas.id,
    type: Joi.string().valid('stock_in', 'stock_out', 'adjustment').required(),
    quantity: Joi.number().integer().positive().required(),
    reason: Joi.string().max(255).required(),
    notes: commonSchemas.description,
  }),
};

/**
 * Order validation schemas
 */
const orderValidation = {
  create: Joi.object({
    customerId: commonSchemas.id,
    items: Joi.array().items(
      Joi.object({
        productId: commonSchemas.id,
        quantity: Joi.number().integer().positive().required(),
        price: Joi.number().positive().precision(2).required(),
        notes: Joi.string().max(255).optional(),
      })
    ).min(1).required(),
    shippingAddress: Joi.object({
      street: Joi.string().max(255).required(),
      city: Joi.string().max(100).required(),
      state: Joi.string().max(100).required(),
      zipCode: Joi.string().max(20).required(),
      country: Joi.string().max(100).default('USA'),
    }).required(),
    specialInstructions: commonSchemas.description,
    urgency: Joi.string().valid('normal', 'urgent').default('normal'),
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid(...Object.values(ORDER_STATUS)).required(),
    notes: commonSchemas.description,
  }),

  search: Joi.object({
    customerId: Joi.number().integer().positive().optional(),
    status: Joi.string().valid(...Object.values(ORDER_STATUS)).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional(),
    search: Joi.string().max(100).optional(),
    page: commonSchemas.page,
    limit: commonSchemas.limit,
    sortBy: commonSchemas.sortBy,
    sortOrder: commonSchemas.sortOrder,
  }),
};

/**
 * Delivery validation schemas
 */
const deliveryValidation = {
  create: Joi.object({
    orderId: commonSchemas.id,
    deliveryPersonId: commonSchemas.id,
    estimatedDeliveryTime: Joi.date().min('now').required(),
    specialInstructions: commonSchemas.description,
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid(...Object.values(DELIVERY_STATUS)).required(),
    notes: commonSchemas.description,
    deliveredAt: Joi.date().when('status', {
      is: DELIVERY_STATUS.DELIVERED,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }),

  assignDelivery: Joi.object({
    deliveryPersonId: commonSchemas.id,
    estimatedDeliveryTime: Joi.date().min('now').required(),
  }),
};

/**
 * Inquiry validation schemas
 */
const inquiryValidation = {
  create: Joi.object({
    customerId: commonSchemas.id,
    type: Joi.string().valid('general', 'order', 'delivery', 'product', 'complaint', 'feedback').required(),
    subject: Joi.string().min(5).max(200).required(),
    message: Joi.string().min(10).max(2000).required(),
    orderId: Joi.number().integer().positive().optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    attachments: Joi.array().items(Joi.string()).max(3).optional(),
  }),

  respond: Joi.object({
    response: Joi.string().min(10).max(2000).required(),
    status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').optional(),
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').required(),
    notes: commonSchemas.description,
  }),
};

/**
 * QR Code validation schemas
 */
const qrCodeValidation = {
  generate: Joi.object({
    type: Joi.string().valid('order', 'product', 'delivery', 'customer').required(),
    referenceId: commonSchemas.id,
    expiresAt: Joi.date().min('now').optional(),
    data: Joi.object().optional(),
  }),

  scan: Joi.object({
    qrData: Joi.string().required(),
    scannedBy: commonSchemas.id,
    location: Joi.object({
      latitude: Joi.number().min(-90).max(90).optional(),
      longitude: Joi.number().min(-180).max(180).optional(),
    }).optional(),
  }),
};

/**
 * File upload validation
 */
const fileValidation = {
  upload: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    mimetype: Joi.string().required(),
    size: Joi.number().max(5 * 1024 * 1024).required(), // 5MB max
  }),
};

/**
 * Pagination validation
 */
const paginationValidation = Joi.object({
  page: commonSchemas.page,
  limit: commonSchemas.limit,
  sortBy: commonSchemas.sortBy,
  sortOrder: commonSchemas.sortOrder,
});

/**
 * Validation middleware generator
 */
const validateSchema = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    req[property] = value;
    next();
  };
};

module.exports = {
  userValidation,
  customerValidation,
  inventoryValidation,
  orderValidation,
  deliveryValidation,
  inquiryValidation,
  qrCodeValidation,
  fileValidation,
  paginationValidation,
  validateSchema,
};
