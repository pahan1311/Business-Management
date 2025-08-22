import React, { createContext, useContext, useReducer } from 'react';
import { generateId } from '../utils/helpers';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Initial state
const initialState = {
  notifications: [],
  loading: false,
  error: null,
  cart: [],
  orders: [],
  customers: [],
  inventory: [],
  staff: [],
  deliveries: [],
  tasks: [],
  inquiries: []
};

// Actions
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_CART: 'SET_CART',
  ADD_TO_CART: 'ADD_TO_CART',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  CLEAR_CART: 'CLEAR_CART',
  SET_ORDERS: 'SET_ORDERS',
  ADD_ORDER: 'ADD_ORDER',
  UPDATE_ORDER: 'UPDATE_ORDER',
  SET_CUSTOMERS: 'SET_CUSTOMERS',
  ADD_CUSTOMER: 'ADD_CUSTOMER',
  UPDATE_CUSTOMER: 'UPDATE_CUSTOMER',
  SET_INVENTORY: 'SET_INVENTORY',
  ADD_INVENTORY_ITEM: 'ADD_INVENTORY_ITEM',
  UPDATE_INVENTORY_ITEM: 'UPDATE_INVENTORY_ITEM',
  SET_STAFF: 'SET_STAFF',
  ADD_STAFF: 'ADD_STAFF',
  UPDATE_STAFF: 'UPDATE_STAFF',
  SET_DELIVERIES: 'SET_DELIVERIES',
  ADD_DELIVERY: 'ADD_DELIVERY',
  UPDATE_DELIVERY: 'UPDATE_DELIVERY',
  SET_TASKS: 'SET_TASKS',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  SET_INQUIRIES: 'SET_INQUIRIES',
  ADD_INQUIRY: 'ADD_INQUIRY',
  UPDATE_INQUIRY: 'UPDATE_INQUIRY'
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    case ACTIONS.ADD_NOTIFICATION:
      return { 
        ...state, 
        notifications: [...state.notifications, { 
          id: generateId(), 
          ...action.payload 
        }] 
      };
    
    case ACTIONS.REMOVE_NOTIFICATION:
      return { 
        ...state, 
        notifications: state.notifications.filter(n => n.id !== action.payload) 
      };
    
    case ACTIONS.SET_CART:
      return { ...state, cart: action.payload };
    
    case ACTIONS.ADD_TO_CART:
      return { ...state, cart: [...state.cart, action.payload] };
    
    case ACTIONS.REMOVE_FROM_CART:
      return { 
        ...state, 
        cart: state.cart.filter(item => item.id !== action.payload) 
      };
    
    case ACTIONS.CLEAR_CART:
      return { ...state, cart: [] };
    
    case ACTIONS.SET_ORDERS:
      return { ...state, orders: action.payload };
    
    case ACTIONS.ADD_ORDER:
      return { ...state, orders: [...state.orders, action.payload] };
    
    case ACTIONS.UPDATE_ORDER:
      return { 
        ...state, 
        orders: state.orders.map(order => 
          order.id === action.payload.id ? action.payload : order
        ) 
      };
    
    // Similar patterns for other entities...
    case ACTIONS.SET_CUSTOMERS:
      return { ...state, customers: action.payload };
    
    case ACTIONS.SET_INVENTORY:
      return { ...state, inventory: action.payload };
    
    case ACTIONS.SET_STAFF:
      return { ...state, staff: action.payload };
    
    case ACTIONS.SET_DELIVERIES:
      return { ...state, deliveries: action.payload };
    
    case ACTIONS.SET_TASKS:
      return { ...state, tasks: action.payload };
    
    case ACTIONS.SET_INQUIRIES:
      return { ...state, inquiries: action.payload };
    
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Helper functions
  const setLoading = (loading) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: error });
  };

  const clearError = () => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  };

  const addNotification = (notification) => {
    dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: notification });
    // Auto remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  };

  const removeNotification = (id) => {
    dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: id });
  };

  const value = {
    ...state,
    dispatch,
    setLoading,
    setError,
    clearError,
    addNotification,
    removeNotification,
    ACTIONS
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
