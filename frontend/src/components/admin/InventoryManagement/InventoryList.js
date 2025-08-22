import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../../../services/api';
import { useCrud } from '../../../hooks/useApi';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import LoadingSpinner from '../../common/LoadingSpinner';
import { formatCurrency } from '../../../utils/helpers';

const InventoryList = () => {
  const {
    items: inventory,
    loading,
    fetchAll,
    create,
    update,
    remove
  } = useCrud(inventoryAPI);

  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    minStock: '',
    category: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  // Ensure inventory is an array before filtering
  const inventoryArray = Array.isArray(inventory) ? inventory : 
                       (inventory && inventory.items ? inventory.items : []);
  
  const filteredInventory = inventoryArray.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = () => {
    setSelectedItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      quantity: '',
      minStock: '',
      category: ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price || '',
      quantity: item.quantity || '',
      minStock: item.minStock || '',
      category: item.category || ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleDeleteItem = async (item) => {
    if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
      // Use _id (MongoDB) or fallback to id
      await remove(item._id || item.id);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      errors.price = 'Valid price is required';
    }

    if (!formData.quantity || isNaN(formData.quantity) || parseInt(formData.quantity) < 0) {
      errors.quantity = 'Valid quantity is required';
    }

    if (!formData.minStock || isNaN(formData.minStock) || parseInt(formData.minStock) < 0) {
      errors.minStock = 'Valid minimum stock is required';
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setModalLoading(true);
    try {
      const itemData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        minStock: parseInt(formData.minStock)
      };

      if (selectedItem) {
        // Use _id (MongoDB) or fallback to id
        await update(selectedItem._id || selectedItem.id, itemData);
      } else {
        await create(itemData);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save item:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const getStockStatus = (item) => {
    if (item.quantity <= 0) return { status: 'Out of Stock', color: 'danger' };
    if (item.quantity <= item.minStock) return { status: 'Low Stock', color: 'warning' };
    return { status: 'In Stock', color: 'success' };
  };

  if (loading) {
    return <LoadingSpinner text="Loading inventory..." />;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Inventory Management</h2>
        <Button variant="primary" onClick={handleAddItem}>
          <i className="bi bi-plus me-2"></i>
          Add Product
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="row g-2">
            <div className="col-4">
              <div className="card text-center">
                <div className="card-body py-2">
                  <h6 className="mb-0 text-success">{inventoryArray.filter(i => i.quantity > i.minStock).length}</h6>
                  <small className="text-muted">In Stock</small>
                </div>
              </div>
            </div>
            <div className="col-4">
              <div className="card text-center">
                <div className="card-body py-2">
                  <h6 className="mb-0 text-warning">{inventoryArray.filter(i => i.quantity <= i.minStock && i.quantity > 0).length}</h6>
                  <small className="text-muted">Low Stock</small>
                </div>
              </div>
            </div>
            <div className="col-4">
              <div className="card text-center">
                <div className="card-body py-2">
                  <h6 className="mb-0 text-danger">{inventoryArray.filter(i => i.quantity <= 0).length}</h6>
                  <small className="text-muted">Out of Stock</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <div className="card-body">
          {filteredInventory.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-box-seam fs-1 text-muted d-block mb-2"></i>
              <p className="text-muted">No products found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Min Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map(item => {
                    const stockStatus = getStockStatus(item);
                    return (
                      <tr key={item._id || item.id}>
                        <td>
                          <div>
                            <strong>{item.name}</strong>
                            {item.description && (
                              <>
                                <br />
                                <small className="text-muted">{item.description}</small>
                              </>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-secondary">{item.category}</span>
                        </td>
                        <td>
                          <strong>{formatCurrency(item.price)}</strong>
                        </td>
                        <td>
                          <span className={`fw-bold text-${stockStatus.color}`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td>{item.minStock}</td>
                        <td>
                          <span className={`badge bg-${stockStatus.color}`}>
                            {stockStatus.status}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleEditItem(item)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteItem(item)}
                            >
                              Delete
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

      {/* Product Form Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        title={selectedItem ? 'Edit Product' : 'Add New Product'}
        onSave={handleSubmit}
        loading={modalLoading}
      >
        <form>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                />
                {formErrors.name && (
                  <div className="invalid-feedback">{formErrors.name}</div>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Category *</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.category ? 'is-invalid' : ''}`}
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="Enter category"
                />
                {formErrors.category && (
                  <div className="invalid-feedback">{formErrors.category}</div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter product description"
              rows="3"
            />
          </div>

          <div className="row">
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`form-control ${formErrors.price ? 'is-invalid' : ''}`}
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
                {formErrors.price && (
                  <div className="invalid-feedback">{formErrors.price}</div>
                )}
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Quantity *</label>
                <input
                  type="number"
                  min="0"
                  className={`form-control ${formErrors.quantity ? 'is-invalid' : ''}`}
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="0"
                />
                {formErrors.quantity && (
                  <div className="invalid-feedback">{formErrors.quantity}</div>
                )}
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Min Stock *</label>
                <input
                  type="number"
                  min="0"
                  className={`form-control ${formErrors.minStock ? 'is-invalid' : ''}`}
                  name="minStock"
                  value={formData.minStock}
                  onChange={handleInputChange}
                  placeholder="0"
                />
                {formErrors.minStock && (
                  <div className="invalid-feedback">{formErrors.minStock}</div>
                )}
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryList;
