import { createSlice } from '@reduxjs/toolkit';

// Try to get user data from localStorage if it exists
let storedUser = null;
try {
  const userString = localStorage.getItem('user');
  if (userString) {
    storedUser = JSON.parse(userString);
  }
} catch (e) {
  console.error('Failed to parse stored user:', e);
}

const storedToken = localStorage.getItem('token');

const initialState = {
  user: storedUser,
  token: storedToken,
  isAuthenticated: !!storedToken && !!storedUser,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
