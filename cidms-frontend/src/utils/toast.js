import { useSnackbar } from 'notistack';
import { createRef } from 'react';

// Create a hook that provides toast functionality similar to react-toastify
// but uses notistack under the hood
export const useToast = () => {
  const { enqueueSnackbar } = useSnackbar();

  const toast = {
    success: (message) => {
      enqueueSnackbar(message, { variant: 'success' });
    },
    error: (message) => {
      enqueueSnackbar(message, { variant: 'error' });
    },
    info: (message) => {
      enqueueSnackbar(message, { variant: 'info' });
    },
    warning: (message) => {
      enqueueSnackbar(message, { variant: 'warning' });
    }
  };

  return toast;
};

// For non-hook usage (for components that can't use hooks)
// We'll use a ref to store the enqueueSnackbar function
export const notistackRef = createRef();

// This is a fallback toast implementation that doesn't require hooks
// It's meant for easier migration from react-toastify
const toast = {
  success: (message) => {
    if (notistackRef.current) {
      notistackRef.current.enqueueSnackbar(message, { variant: 'success' });
    }
  },
  error: (message) => {
    if (notistackRef.current) {
      notistackRef.current.enqueueSnackbar(message, { variant: 'error' });
    }
  },
  info: (message) => {
    if (notistackRef.current) {
      notistackRef.current.enqueueSnackbar(message, { variant: 'info' });
    }
  },
  warning: (message) => {
    if (notistackRef.current) {
      notistackRef.current.enqueueSnackbar(message, { variant: 'warning' });
    }
  }
};

export default toast;
