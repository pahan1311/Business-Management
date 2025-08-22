import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import StatusBadge from '../../common/StatusBadge';
import { formatDate } from '../../../utils/helpers';

const InventoryOverview = () => {
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    lowStock: false,
    search: ''
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [inventory, filters, sortBy, sortOrder]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/admin/inventory');
      setInventory(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiService.get('/inventory/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...inventory];

    // Apply filters
    if (filters.category !== 'all') {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.lowStock) {
      filtered = filtered.filter(item => 
        item.currentStock <= (item.minimumStock || 0)
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.sku.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'currentStock':
          aValue = a.currentStock || 0;
          bValue = b.currentStock || 0;
          break;
        case 'minimumStock':
          aValue = a.minimumStock || 0;
          bValue = b.minimumStock || 0;
          break;
        case 'unitPrice':
          aValue = a.unitPrice || 0;
          bValue = b.unitPrice || 0;
          break;
        case 'lastUpdated':
          aValue = new Date(a.lastUpdated || 0);
          bValue = new Date(b.lastUpdated || 0);
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredInventory(filtered);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStockStatus = (item) => {
    const current = item.currentStock || 0;
    const minimum = item.minimumStock || 0;
    
    if (current === 0) return 'out_of_stock';
    if (current <= minimum) return 'low_stock';
    if (current <= minimum * 2) return 'medium_stock';
    return 'in_stock';
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'out_of_stock':
        return 'danger';
      case 'low_stock':
        return 'warning';
      case 'medium_stock':
        return 'info';
      case 'in_stock':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getInventoryStats = () => {
    const total = inventory.length;
    const inStock = inventory.filter(item => (item.currentStock || 0) > 0).length;
    const lowStock = inventory.filter(item => 
      (item.currentStock || 0) <= (item.minimumStock || 0) && (item.currentStock || 0) > 0
    ).length;
    const outOfStock = inventory.filter(item => (item.currentStock || 0) === 0).length;
    const totalValue = inventory.reduce((sum, item) => 
      sum + ((item.currentStock || 0) * (item.unitPrice || 0)), 0
    );

    return { total, inStock, lowStock, outOfStock, totalValue };
  };

  const stats = getInventoryStats();

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Inventory Overview</h4>
            <div className="btn-group">
              <button
                className="btn btn-outline-primary"
                onClick={fetchInventory}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </button>
              <button className="btn btn-primary">
                <i className="bi bi-plus-lg me-2"></i>
                Add Product
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row">
            <div className="col-md-2">
              <div className="card text-center border-primary">
                <div className="card-body">
                  <h3 className="text-primary">{stats.total}</h3>
                  <small className="text-muted">Total Products</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center border-success">
                <div className="card-body">
                  <h3 className="text-success">{stats.inStock}</h3>
                  <small className="text-muted">In Stock</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center border-warning">
                <div className="card-body">
                  <h3 className="text-warning">{stats.lowStock}</h3>
                  <small className="text-muted">Low Stock</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center border-danger">
                <div className="card-body">
                  <h3 className="text-danger">{stats.outOfStock}</h3>
                  <small className="text-muted">Out of Stock</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center border-info">
                <div className="card-body">
                  <h3 className="text-info">${stats.totalValue.toFixed(2)}</h3>
                  <small className="text-muted">Total Inventory Value</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <label htmlFor="categoryFilter" className="form-label">Category</label>
              <select
                id="categoryFilter"
                className="form-select form-select-sm"
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="statusFilter" className="form-label">Stock Status</label>
              <select
                id="statusFilter"
                className="form-select form-select-sm"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">All Status</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Filters</label>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="lowStockFilter"
                  checked={filters.lowStock}
                  onChange={(e) => setFilters(prev => ({ ...prev, lowStock: e.target.checked }))}
                />
                <label className="form-check-label small" htmlFor="lowStockFilter">
                  Low Stock Only
                </label>
              </div>
            </div>
            <div className="col-md-3">
              <label htmlFor="searchFilter" className="form-label">Search</label>
              <input
                type="text"
                id="searchFilter"
                className="form-control form-control-sm"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search products..."
              />
            </div>
            <div className="col-md-2">
              <label htmlFor="sortBy" className="form-label">Sort By</label>
              <select
                id="sortBy"
                className="form-select form-select-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Name</option>
                <option value="currentStock">Current Stock</option>
                <option value="minimumStock">Minimum Stock</option>
                <option value="unitPrice">Unit Price</option>
                <option value="lastUpdated">Last Updated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-box display-1 text-muted"></i>
              <h5 className="mt-3">No products found</h5>
              <p className="text-muted">No products match the selected filters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th 
                      className="cursor-pointer" 
                      onClick={() => handleSort('name')}
                    >
                      Product 
                      {sortBy === 'name' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th>Category</th>
                    <th 
                      className="cursor-pointer text-center" 
                      onClick={() => handleSort('currentStock')}
                    >
                      Current Stock
                      {sortBy === 'currentStock' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th 
                      className="cursor-pointer text-center" 
                      onClick={() => handleSort('minimumStock')}
                    >
                      Min Stock
                      {sortBy === 'minimumStock' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th 
                      className="cursor-pointer text-center" 
                      onClick={() => handleSort('unitPrice')}
                    >
                      Unit Price
                      {sortBy === 'unitPrice' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Value</th>
                    <th 
                      className="cursor-pointer text-center" 
                      onClick={() => handleSort('lastUpdated')}
                    >
                      Last Updated
                      {sortBy === 'lastUpdated' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map(item => {
                    const stockStatus = getStockStatus(item);
                    const stockValue = (item.currentStock || 0) * (item.unitPrice || 0);
                    
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="rounded me-3"
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                              />
                            )}
                            <div>
                              <div className="fw-bold">{item.name}</div>
                              <small className="text-muted">SKU: {item.sku}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-secondary">{item.category}</span>
                        </td>
                        <td className="text-center">
                          <span className={`fw-bold ${stockStatus === 'out_of_stock' ? 'text-danger' : stockStatus === 'low_stock' ? 'text-warning' : ''}`}>
                            {item.currentStock || 0}
                          </span>
                        </td>
                        <td className="text-center">
                          {item.minimumStock || 0}
                        </td>
                        <td className="text-center">
                          ${(item.unitPrice || 0).toFixed(2)}
                        </td>
                        <td className="text-center">
                          <StatusBadge 
                            status={stockStatus}
                            className={`bg-${getStockStatusColor(stockStatus)}`}
                          />
                        </td>
                        <td className="text-center fw-bold">
                          ${stockValue.toFixed(2)}
                        </td>
                        <td className="text-center">
                          <small className="text-muted">
                            {formatDate(item.lastUpdated)}
                          </small>
                        </td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-primary">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-outline-info">
                              <i className="bi bi-eye"></i>
                            </button>
                            <button className="btn btn-outline-success">
                              <i className="bi bi-plus-lg"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryOverview;
