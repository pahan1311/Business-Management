import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Cart actions
export const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART'
};

// Initial state
const initialState = {
  items: [],
  totalItems: 0,
  totalAmount: 0
};

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const { product } = action.payload;
      
      // Check if item already exists in cart
      const existingItemIndex = state.items.findIndex(
        item => item.productId === product.productId
      );
      
      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        const updatedItems = [...state.items];
        const existingItem = updatedItems[existingItemIndex];
        
        // Make sure we don't exceed available stock
        const newQuantity = Math.min(
          existingItem.quantity + product.quantity,
          existingItem.stock
        );
        
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity
        };
        
        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        return {
          ...state,
          items: updatedItems,
          totalItems,
          totalAmount
        };
      } else {
        // New item, add to cart
        const updatedItems = [...state.items, product];
        
        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        return {
          ...state,
          items: updatedItems,
          totalItems,
          totalAmount
        };
      }
    }
    
    case CART_ACTIONS.REMOVE_ITEM: {
      const { index } = action.payload;
      
      // Remove item at specified index
      const updatedItems = state.items.filter((_, i) => i !== index);
      
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalAmount
      };
    }
    
    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { index, quantity } = action.payload;
      
      // Make sure quantity is not less than 1 or more than available stock
      const newQuantity = Math.max(
        1, 
        Math.min(quantity, state.items[index].stock)
      );
      
      // Update quantity of item at specified index
      const updatedItems = [...state.items];
      updatedItems[index] = {
        ...updatedItems[index],
        quantity: newQuantity
      };
      
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalAmount
      };
    }
    
    case CART_ACTIONS.CLEAR_CART: {
      return initialState;
    }
    
    default:
      return state;
  }
};

// Create context
const CartContext = createContext();

// Create provider component
export const CartProvider = ({ children }) => {
  // Load cart from localStorage if available
  const loadInitialState = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : initialState;
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return initialState;
    }
  };
  
  const [cart, dispatch] = useReducer(cartReducer, loadInitialState());
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart]);
  
  // Action creators
  const addToCart = (product) => {
    dispatch({
      type: CART_ACTIONS.ADD_ITEM,
      payload: { product }
    });
  };
  
  const removeFromCart = (index) => {
    dispatch({
      type: CART_ACTIONS.REMOVE_ITEM,
      payload: { index }
    });
  };
  
  const updateQuantity = (index, quantity) => {
    dispatch({
      type: CART_ACTIONS.UPDATE_QUANTITY,
      payload: { index, quantity }
    });
  };
  
  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };
  
  const value = {
    cart,
    items: cart.items,
    totalItems: cart.totalItems,
    totalAmount: cart.totalAmount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Create custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
