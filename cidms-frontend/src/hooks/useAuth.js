import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { setCredentials, logout } from '../features/auth/authSlice';
import { socketManager } from '../app/socket';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && user) {
      socketManager.connect(token);
    }
  }, [token, user]);

  const login = (credentials) => {
    dispatch(setCredentials(credentials));
    socketManager.connect(credentials.token);
  };

  const signOut = () => {
    dispatch(logout());
    socketManager.disconnect();
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout: signOut,
  };
};
