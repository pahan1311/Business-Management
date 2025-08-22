import { authAPI } from './api';
import { STORAGE_KEYS } from '../utils/constants';
import { setToStorage, removeFromStorage, getFromStorage } from '../utils/helpers';

class AuthService {
  constructor() {
    this.token = getFromStorage(STORAGE_KEYS.AUTH_TOKEN);
    this.user = getFromStorage(STORAGE_KEYS.USER_DATA);
  }

  async login(email, password) {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      
      this.token = token;
      this.user = user;
      
      setToStorage(STORAGE_KEYS.AUTH_TOKEN, token);
      setToStorage(STORAGE_KEYS.USER_DATA, user);
      
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  }

  async signup(userData) {
    try {
      const response = await authAPI.register(userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  }

  async register(userData) {
    // Alias for signup to maintain backward compatibility
    return this.signup(userData);
  }

  logout() {
    this.token = null;
    this.user = null;
    removeFromStorage(STORAGE_KEYS.AUTH_TOKEN);
    removeFromStorage(STORAGE_KEYS.USER_DATA);
  }

  isAuthenticated() {
    return !!this.token;
  }

  getCurrentUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }

  hasRole(role) {
    return this.user?.role === role;
  }

  async refreshUser() {
    try {
      const response = await authAPI.getCurrentUser();
      this.user = response.data;
      setToStorage(STORAGE_KEYS.USER_DATA, this.user);
      return this.user;
    } catch (error) {
      this.logout();
      throw error;
    }
  }
}

const authServiceInstance = new AuthService();
export default authServiceInstance;
