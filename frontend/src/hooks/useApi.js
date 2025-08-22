import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const useApi = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addNotification } = useApp();

  const executeApiCall = async (...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall(...args);
      setData(response.data);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    return executeApiCall();
  };

  // Auto-execute on mount if dependencies are provided
  useEffect(() => {
    if (dependencies.length > 0) {
      executeApiCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    data,
    loading,
    error,
    execute: executeApiCall,
    refetch
  };
};

// Hook for CRUD operations
export const useCrud = (apiService) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addNotification } = useApp();

  const handleApiCall = async (apiCall, successMessage) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall();
      if (successMessage) {
        addNotification({
          type: 'success',
          message: successMessage
        });
      }
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = async (params = {}) => {
    console.log('fetchAll called with params:', params);
    try {
      const result = await handleApiCall(() => apiService.getAll(params));
      console.log('fetchAll result:', result);
      
      if (result.success) {
        // Handle different response structures
        if (Array.isArray(result.data)) {
          console.log('Setting items from array:', result.data);
          setItems(result.data);
        } else if (result.data && result.data.users) {
          // Handle response with users property
          console.log('Setting items from users property:', result.data.users);
          setItems(result.data.users);
        } else if (result.data && result.data.orders) {
          // Handle orders API response structure
          console.log('Setting items from orders property:', result.data.orders);
          setItems(result.data.orders);
        } else if (result.data && result.data.items) {
          // Handle paginated response where items are in an 'items' property
          console.log('Setting items from items property:', result.data.items);
          setItems(result.data.items);
        } else if (result.data && result.data.length === undefined) {
          // For any other object type response, convert to array with the object as the only item
          console.log('Setting single item as array:', [result.data]);
          setItems([result.data]);
        } else {
          // Fallback
          console.log('Using fallback for data:', result.data || []);
          setItems(result.data || []);
        }
        return result;
      } else {
        // Handle error case
        console.error('API call failed but did not throw:', result);
        setItems([]);
        return result;
      }
    } catch (err) {
      // Handle any errors that might have been missed
      console.error('Unexpected error in fetchAll:', err);
      setItems([]);
      return { success: false, error: err.message };
    }
  };

  const fetchById = async (id) => {
    return handleApiCall(() => apiService.getById(id));
  };

  const create = async (item) => {
    const result = await handleApiCall(
      () => apiService.create(item),
      'Item created successfully'
    );
    if (result.success) {
      setItems(prev => [...prev, result.data]);
    }
    return result;
  };

  const update = async (id, item) => {
    const result = await handleApiCall(
      () => apiService.update(id, item),
      'Item updated successfully'
    );
    if (result.success) {
      setItems(prev => prev.map(i => (i.id === id || i._id === id) ? result.data : i));
    }
    return result;
  };

  const remove = async (id) => {
    const result = await handleApiCall(
      () => apiService.delete(id),
      'Item deleted successfully'
    );
    if (result.success) {
      setItems(prev => prev.filter(i => (i.id !== id && i._id !== id)));
    }
    return result;
  };

  return {
    items,
    loading,
    error,
    fetchAll,
    fetchById,
    create,
    update,
    remove,
    setItems
  };
};
