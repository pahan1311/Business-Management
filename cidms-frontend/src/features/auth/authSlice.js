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
      const { user, token, accessToken, refreshToken } = action.payload;
      // Use accessToken if provided, fallback to token for backward compatibility
      const authToken = accessToken || token;
      console.log('Setting credentials:', { user: user?.email, hasToken: !!authToken });
      state.user = user;
      state.token = authToken;
      state.isAuthenticated = true;
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Store refresh token if provided
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
