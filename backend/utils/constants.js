/**
 * Application Constants
 */

// User roles
const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  CUSTOMER: 'customer',
  DELIVERY: 'delivery',
};

// User status
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
};

// Order status
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
};

// Delivery status
const DELIVERY_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  RETURNED: 'returned',
};

// Inquiry status
const INQUIRY_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

// Inquiry types
const INQUIRY_TYPES = {
  GENERAL: 'general',
  ORDER: 'order',
  DELIVERY: 'delivery',
  PRODUCT: 'product',
  COMPLAINT: 'complaint',
  FEEDBACK: 'feedback',
};

// Priority levels
const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

// Payment status
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

// Payment methods
const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  ONLINE: 'online',
  BANK_TRANSFER: 'bank_transfer',
  WALLET: 'wallet',
};

// QR code types
const QR_CODE_TYPES = {
  ORDER: 'order',
  PRODUCT: 'product',
  DELIVERY: 'delivery',
  CUSTOMER: 'customer',
};

// Inventory actions
const INVENTORY_ACTIONS = {
  STOCK_IN: 'stock_in',
  STOCK_OUT: 'stock_out',
  ADJUSTMENT: 'adjustment',
  DAMAGED: 'damaged',
  EXPIRED: 'expired',
  RETURNED: 'returned',
};

// Notification types
const NOTIFICATION_TYPES = {
  ORDER_UPDATE: 'order_update',
  DELIVERY_UPDATE: 'delivery_update',
  INQUIRY_RESPONSE: 'inquiry_response',
  SYSTEM_ALERT: 'system_alert',
  PROMOTIONAL: 'promotional',
};

// File types
const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const ALLOWED_DOCUMENT_TYPES = ['pdf', 'doc', 'docx', 'txt'];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

// API response messages
const RESPONSE_MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
  BAD_REQUEST: 'Bad request',
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Date formats
const DATE_FORMATS = {
  DATE_ONLY: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIMESTAMP: 'YYYY-MM-DD HH:mm:ss.SSS',
  DISPLAY_DATE: 'MMM DD, YYYY',
  DISPLAY_DATETIME: 'MMM DD, YYYY HH:mm',
};

// Regular expressions
const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
};

// Error codes
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT: 'INVALID_INPUT',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_OPERATION: 'INVALID_OPERATION',
};

// Cache keys
const CACHE_KEYS = {
  USER_PROFILE: 'user_profile_',
  USER_PERMISSIONS: 'user_permissions_',
  INVENTORY_ITEM: 'inventory_item_',
  ORDER_DETAILS: 'order_details_',
  CUSTOMER_ORDERS: 'customer_orders_',
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400, // 24 hours
};

module.exports = {
  USER_ROLES,
  USER_STATUS,
  ORDER_STATUS,
  DELIVERY_STATUS,
  INQUIRY_STATUS,
  INQUIRY_TYPES,
  PRIORITY_LEVELS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  QR_CODE_TYPES,
  INVENTORY_ACTIONS,
  NOTIFICATION_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_FILE_TYPES,
  RESPONSE_MESSAGES,
  HTTP_STATUS,
  PAGINATION,
  DATE_FORMATS,
  REGEX_PATTERNS,
  ERROR_CODES,
  CACHE_KEYS,
  CACHE_TTL,
};
