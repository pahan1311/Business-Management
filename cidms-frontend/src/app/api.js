import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL + '/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    console.log('Preparing headers with token:', token ? 'Present' : 'Missing');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    // Try to refresh token
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshResult = await baseQuery({
        url: '/auth/refresh',
        method: 'POST',
        body: { refreshToken }
      }, api, extraOptions);
      
      if (refreshResult.data) {
        api.dispatch({ type: 'auth/setCredentials', payload: refreshResult.data });
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch({ type: 'auth/logout' });
      }
    } else {
      api.dispatch({ type: 'auth/logout' });
    }
  }
  
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Customer', 'Product', 'Order', 'Delivery', 'Task', 'Inquiry'],
  endpoints: () => ({}),
});
