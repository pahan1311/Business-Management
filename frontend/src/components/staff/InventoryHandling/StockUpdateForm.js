import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

const StockUpdateForm = ({ onUpdate, initialData = null }) => {
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    currentStock: 0,
    adjustment: 0,
    adjustmentType: 'add', // add, subtract, set
    reason: '',
    location: '',
    batchNumber: '',
    expiryDate: '',
    notes: ''
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProducts();
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  const fetchProducts = async () => {
    try {
      const response = await apiService.get('/inventory/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleProductSelect = (e) => {
    const productId = e.target.value;
    const product = products.find(p => p.id === productId);
    
    if (product) {
      setFormData(prev => ({
        ...prev,
        productId,
        productName: product.name,
        currentStock: product.currentStock || 0
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.productId) {
      newErrors.productId = 'Product is required';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    if (formData.adjustmentType !== 'set' && formData.adjustment === 0) {
      newErrors.adjustment = 'Adjustment quantity must be greater than 0';
    }

    if (formData.adjustmentType === 'set' && formData.adjustment < 0) {
      newErrors.adjustment = 'Stock quantity cannot be negative';
    }

    if (formData.adjustmentType === 'subtract' && formData.adjustment > formData.currentStock) {
      newErrors.adjustment = 'Cannot subtract more than current stock';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateNewStock = () => {
    const current = formData.currentStock;
    const adjustment = formData.adjustment;

    switch (formData.adjustmentType) {
      case 'add':
        return current + adjustment;
      case 'subtract':
        return current - adjustment;
      case 'set':
        return adjustment;
      default:
        return current;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        ...formData,
        newStock: calculateNewStock(),
        timestamp: new Date().toISOString()
      };

      await apiService.post('/inventory/stock-update', updateData);
      
      if (onUpdate) {
        onUpdate(updateData);
      }

      // Reset form
      setFormData({
        productId: '',
        productName: '',
        currentStock: 0,
        adjustment: 0,
        adjustmentType: 'add',
        reason: '',
        location: '',
        batchNumber: '',
        expiryDate: '',
        notes: ''
      });

      alert('Stock updated successfully!');
    } catch (error) {
      console.error('Failed to update stock:', error);
      alert('Failed to update stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">
          <i className="bi bi-box-seam me-2"></i>
          Stock Update Form
        </h5>
      </div>

      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row">
            {/* Product Selection */}
            <div className="col-md-6 mb-3">
              <label htmlFor="productId" className="form-label">
                Product <span className="text-danger">*</span>
              </label>
              <select
                id="productId"
                name="productId"
                className={`form-select ${errors.productId ? 'is-invalid' : ''}`}
                value={formData.productId}
                onChange={handleProductSelect}
                required
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Current: {product.currentStock})
                  </option>
                ))}
              </select>
              {errors.productId && (
                <div className="invalid-feedback">{errors.productId}</div>
              )}
            </div>

            {/* Current Stock Display */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Current Stock</label>
              <div className="form-control-plaintext fw-bold">
                {formData.currentStock} units
              </div>
            </div>

            {/* Adjustment Type */}
            <div className="col-md-4 mb-3">
              <label htmlFor="adjustmentType" className="form-label">
                Adjustment Type
              </label>
              <select
                id="adjustmentType"
                name="adjustmentType"
                className="form-select"
                value={formData.adjustmentType}
                onChange={handleInputChange}
              >
                <option value="add">Add Stock</option>
                <option value="subtract">Remove Stock</option>
                <option value="set">Set Stock Level</option>
              </select>
            </div>

            {/* Adjustment Quantity */}
            <div className="col-md-4 mb-3">
              <label htmlFor="adjustment" className="form-label">
                {formData.adjustmentType === 'set' ? 'New Stock Level' : 'Quantity'} 
                <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                id="adjustment"
                name="adjustment"
                className={`form-control ${errors.adjustment ? 'is-invalid' : ''}`}
                value={formData.adjustment}
                onChange={handleInputChange}
                min="0"
                step="1"
                required
              />
              {errors.adjustment && (
                <div className="invalid-feedback">{errors.adjustment}</div>
              )}
            </div>

            {/* New Stock Preview */}
            <div className="col-md-4 mb-3">
              <label className="form-label">New Stock Level</label>
              <div className={`form-control-plaintext fw-bold ${calculateNewStock() < 0 ? 'text-danger' : 'text-success'}`}>
                {calculateNewStock()} units
              </div>
            </div>

            {/* Reason */}
            <div className="col-md-6 mb-3">
              <label htmlFor="reason" className="form-label">
                Reason <span className="text-danger">*</span>
              </label>
              <select
                id="reason"
                name="reason"
                className={`form-select ${errors.reason ? 'is-invalid' : ''}`}
                value={formData.reason}
                onChange={handleInputChange}
                required
              >
                <option value="">Select reason</option>
                <option value="stock_received">Stock Received</option>
                <option value="stock_sold">Stock Sold</option>
                <option value="stock_damaged">Stock Damaged</option>
                <option value="stock_expired">Stock Expired</option>
                <option value="stock_returned">Stock Returned</option>
                <option value="stock_transfer">Stock Transfer</option>
                <option value="inventory_count">Inventory Count</option>
                <option value="other">Other</option>
              </select>
              {errors.reason && (
                <div className="invalid-feedback">{errors.reason}</div>
              )}
            </div>

            {/* Location */}
            <div className="col-md-6 mb-3">
              <label htmlFor="location" className="form-label">Location</label>
              <select
                id="location"
                name="location"
                className="form-select"
                value={formData.location}
                onChange={handleInputChange}
              >
                <option value="">Select location</option>
                <option value="warehouse">Warehouse</option>
                <option value="store">Store</option>
                <option value="kitchen">Kitchen</option>
                <option value="storage">Storage Room</option>
                <option value="freezer">Freezer</option>
                <option value="display">Display Area</option>
              </select>
            </div>

            {/* Batch Number */}
            <div className="col-md-6 mb-3">
              <label htmlFor="batchNumber" className="form-label">Batch Number</label>
              <input
                type="text"
                id="batchNumber"
                name="batchNumber"
                className="form-control"
                value={formData.batchNumber}
                onChange={handleInputChange}
                placeholder="Enter batch number"
              />
            </div>

            {/* Expiry Date */}
            <div className="col-md-6 mb-3">
              <label htmlFor="expiryDate" className="form-label">Expiry Date</label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                className="form-control"
                value={formData.expiryDate}
                onChange={handleInputChange}
              />
            </div>

            {/* Notes */}
            <div className="col-12 mb-3">
              <label htmlFor="notes" className="form-label">Additional Notes</label>
              <textarea
                id="notes"
                name="notes"
                className="form-control"
                rows="3"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional information about this stock update..."
              />
            </div>
          </div>

          {/* Summary Card */}
          {formData.productId && (
            <div className="alert alert-info">
              <h6>Update Summary:</h6>
              <p className="mb-1">
                <strong>Product:</strong> {formData.productName}
              </p>
              <p className="mb-1">
                <strong>Current Stock:</strong> {formData.currentStock} units
              </p>
              <p className="mb-1">
                <strong>Action:</strong> 
                {formData.adjustmentType === 'add' && ` Add ${formData.adjustment} units`}
                {formData.adjustmentType === 'subtract' && ` Remove ${formData.adjustment} units`}
                {formData.adjustmentType === 'set' && ` Set to ${formData.adjustment} units`}
              </p>
              <p className="mb-0">
                <strong>New Stock Level:</strong> 
                <span className={calculateNewStock() < 0 ? 'text-danger' : 'text-success'}>
                  {calculateNewStock()} units
                </span>
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="d-flex justify-content-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Updating Stock...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  Update Stock
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockUpdateForm;
