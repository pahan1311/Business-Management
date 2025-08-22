import { useState, useEffect, useCallback } from 'react';
import { inventoryAPI } from '../services/api';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.getPublicProducts(filters);
      setProducts(response.data.products || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await inventoryAPI.getCategories();
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // We don't set error state here because it's not critical
    }
  }, []);

  const fetchProductById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.getById(id);
      return response.data.product;
    } catch (err) {
      console.error(`Error fetching product ${id}:`, err);
      setError('Failed to load product details. Please try again later.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (searchTerm) => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.getPublicProducts({ search: searchTerm });
      return response.data.products || [];
    } catch (err) {
      console.error('Error searching products:', err);
      setError('Failed to search products. Please try again later.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Load products on initial mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  return {
    products,
    categories,
    loading,
    error,
    fetchProducts,
    fetchCategories,
    fetchProductById,
    searchProducts
  };
};
