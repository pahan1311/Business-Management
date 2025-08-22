import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { USER_ROLES } from '../utils/constants';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = authService.getCurrentUser();
    if (currentUser && authService.isAuthenticated()) {
      setUser(currentUser);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await authService.login(email, password);
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const result = await authService.register(userData);
      return result;
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const isAdmin = () => hasRole(USER_ROLES.ADMIN);
  const isCustomer = () => hasRole(USER_ROLES.CUSTOMER);
  const isStaff = () => hasRole(USER_ROLES.STAFF);
  const isDeliveryPerson = () => hasRole(USER_ROLES.DELIVERY);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    hasRole,
    isAdmin,
    isCustomer,
    isStaff,
    isDeliveryPerson
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
