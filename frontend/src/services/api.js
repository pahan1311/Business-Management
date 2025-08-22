import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';
import { getFromStorage } from '../utils/helpers';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getFromStorage(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log all API requests for debugging
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, 
                config.params || config.data);
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`API Response Success: ${response.config.method.toUpperCase()} ${response.config.url}`, 
                response.status, response.data);
    return response;
  },
  (error) => {
    console.error(`API Response Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, 
                  error.response?.status, error.response?.data || error.message);
                  
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/signup', userData),
  getCurrentUser: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout')
};

// Customer APIs
export const customerAPI = {
  getAll: (params = {}) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (customer) => api.post('/customers', customer),
  update: (id, customer) => api.put(`/customers/${id}`, customer),
  delete: (id) => api.delete(`/customers/${id}`)
};

// Product/Inventory APIs
export const inventoryAPI = {
  getAll: (params = {}) => api.get('/inventory', { params }),
  getPublicProducts: (params = {}) => api.get('/inventory/products', { params }),
  getCategories: () => api.get('/inventory/categories'),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (product) => api.post('/inventory', product),
  update: (id, product) => api.put(`/inventory/${id}`, product),
  delete: (id) => api.delete(`/inventory/${id}`),
  updateStock: (id, quantity) => api.patch(`/inventory/${id}/stock`, { quantity }),
  getLowStock: () => api.get('/inventory/low-stock')
};

// Order APIs
export const orderAPI = {
  getAll: (params = {}) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (order) => api.post('/orders', order),
  update: (id, order) => api.put(`/orders/${id}`, order),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  delete: (id) => api.delete(`/orders/${id}`),
  getByCustomer: (customerId) => api.get(`/orders/customer/${customerId}`),
  assignStaff: (id, staffId) => api.patch(`/orders/${id}/assign`, { staffId })
};

// Delivery APIs
export const deliveryAPI = {
  getAll: (params = {}) => api.get('/deliveries', { params }),
  getById: (id) => api.get(`/deliveries/${id}`),
  create: (delivery) => api.post('/deliveries', delivery),
  update: (id, delivery) => api.put(`/deliveries/${id}`, delivery),
  updateStatus: (id, status) => api.patch(`/deliveries/${id}/status`, { status }),
  assignDeliveryPerson: (id, deliveryPersonId) => 
    api.patch(`/deliveries/${id}/assign`, { deliveryPersonId }),
  getByDeliveryPerson: (deliveryPersonId) => 
    api.get(`/deliveries/delivery-person/${deliveryPersonId}`)
};

// User APIs for all user types (admin, staff, customer, delivery)
export const userAPI = {
  getAll: (params = {}) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  getByRole: (role) => api.get('/users', { params: { role } })
};

// Staff APIs
export const staffAPI = {
  getAll: (params = {}) => api.get('/staff', { params }),
  getAvailable: () => api.get('/staff/available'),
  getById: (id) => api.get(`/staff/${id}`),
  create: (staff) => api.post('/staff', staff),
  update: (id, staff) => api.put(`/staff/${id}`, staff),
  delete: (id) => api.delete(`/staff/${id}`)
};

// Task APIs
export const taskAPI = {
  getAll: (params = {}) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (task) => api.post('/tasks', task),
  update: (id, task) => api.put(`/tasks/${id}`, task),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  getByAssignee: (assigneeId) => api.get(`/tasks/assignee/${assigneeId}`)
};

// Inquiry APIs
export const inquiryAPI = {
  getAll: (params = {}) => api.get('/inquiries', { params }),
  getById: (id) => api.get(`/inquiries/${id}`),
  create: (inquiry) => api.post('/inquiries', inquiry),
  update: (id, inquiry) => api.put(`/inquiries/${id}`, inquiry),
  delete: (id) => api.delete(`/inquiries/${id}`),
  getByCustomer: (customerId) => api.get(`/inquiries/customer/${customerId}`)
};

export default api;
