import { DateTime } from 'luxon';

export const formatDate = (date, format = 'DATE_MED') => {
  if (!date) return '';
  return DateTime.fromISO(date).toLocaleString(DateTime[format]);
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return DateTime.fromISO(date).toLocaleString(DateTime.DATETIME_MED);
};

export const formatCurrency = (amount, currency = 'USD') => {
  if (!amount) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatNumber = (number) => {
  if (!number) return '0';
  return new Intl.NumberFormat('en-US').format(number);
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};
