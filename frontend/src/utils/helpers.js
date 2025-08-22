import { VALIDATION } from './constants';

// Format date to readable string
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format currency
export const formatCurrency = (amount) => {
  if (!amount) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Validate email
export const isValidEmail = (email) => {
  return VALIDATION.EMAIL_REGEX.test(email);
};

// Validate phone number
export const isValidPhone = (phone) => {
  return VALIDATION.PHONE_REGEX.test(phone);
};

// Generate random ID that's more stable than Date.now()
export const generateId = () => {
  return 'id_' + 
    Math.random().toString(36).substring(2, 15) + 
    Math.random().toString(36).substring(2, 15);
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Convert status to readable format
export const formatStatus = (status) => {
  if (!status) return '';
  return status.split('_').map(word => capitalize(word)).join(' ');
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Debounce function
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Get status badge color
export const getStatusBadgeColor = (status) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'confirmed':
    case 'processing':
      return 'info';
    case 'ready':
    case 'delivered':
    case 'completed':
      return 'success';
    case 'cancelled':
    case 'failed':
      return 'danger';
    case 'out_for_delivery':
    case 'in_transit':
      return 'primary';
    default:
      return 'secondary';
  }
};

// Local storage helpers
export const getFromStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

export const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};
