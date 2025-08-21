// Order Status Constants
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
};

// Legacy export for backward compatibility
export const ORDER_STATUSES = ORDER_STATUS;

// Delivery Status Constants
export const DELIVERY_STATUS = {
  ASSIGNED: 'ASSIGNED',
  IN_TRANSIT: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  DELAYED: 'DELAYED',
  CANCELLED: 'CANCELLED',
};

// Legacy export for backward compatibility
export const DELIVERY_STATUSES = DELIVERY_STATUS;

// Task Status Constants
export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

// Legacy export for backward compatibility
export const TASK_STATUSES = TASK_STATUS;

// Task Priority Constants
export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
};

export const INQUIRY_STATUSES = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
};

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  DELIVERY: 'DELIVERY',
  CUSTOMER: 'CUSTOMER',
};

export const STOCK_MOVEMENT_TYPES = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUST: 'ADJUST',
};

export const QR_CONTEXTS = {
  ORDER_PICKUP: 'ORDER_PICKUP',
  ORDER_DELIVERY: 'ORDER_DELIVERY',
  ORDER_TRACK: 'ORDER_TRACK',
};

export const PAGINATION_LIMITS = [10, 25, 50, 100];

export const API_ENDPOINTS = {
  AUTH: '/auth',
  CUSTOMERS: '/customers',
  PRODUCTS: '/products',
  INVENTORY: '/inventory',
  ORDERS: '/orders',
  DELIVERIES: '/deliveries',
  TASKS: '/tasks',
  INQUIRIES: '/inquiries',
  QR: '/qr',
  USERS: '/users',
  REPORTS: '/reports',
};
