import React, { useState, useEffect } from 'react';
import { customerAPI } from '../../../services/api';
import { useCrud } from '../../../hooks/useApi';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import LoadingSpinner from '../../common/LoadingSpinner';
import { formatDate, isValidEmail, isValidPhone } from '../../../utils/helpers';

const CustomerList = () => {
  const {
    items: customers,
    loading,
    fetchAll,
    create,
    update,
    remove
  } = useCrud(customerAPI);

  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    role: 'customer'
  });
  const [formErrors, setFormErrors] = useState({});
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      role: 'customer'
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      role: customer.role || 'customer'
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleDeleteCustomer = async (customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      await remove(customer.id);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setModalLoading(true);
    try {
      if (selectedCustomer) {
        await update(selectedCustomer.id, formData);
      } else {
        await create(formData);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save customer:', error);
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

  if (loading) {
    return <LoadingSpinner text="Loading customers..." />;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Customer Management</h2>
        <Button variant="primary" onClick={handleAddCustomer}>
          <i className="bi bi-plus me-2"></i>
          Add Customer
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6 text-end">
          <span className="text-muted">
            Showing {filteredCustomers.length} of {customers.length} customers
          </span>
        </div>
      </div>

      {/* Customer Table */}
      <div className="card">
        <div className="card-body">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-people fs-1 text-muted d-block mb-2"></i>
              <p className="text-muted">No customers found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(customer => (
                    <tr key={customer.id}>
                      <td>
                        <strong>{customer.name}</strong>
                      </td>
                      <td>{customer.email}</td>
                      <td>{customer.phone || 'N/A'}</td>
                      <td>
                        <small>
                          {typeof customer.address === 'object' 
                            ? `${customer.address.street || ''}, 
                               ${customer.address.city || ''}, 
                               ${customer.address.state || ''} 
                               ${customer.address.zip || ''}`
                            : customer.address}
                        </small>
                      </td>
                      <td>{formatDate(customer.createdAt)}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteCustomer(customer)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Customer Form Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        title={selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
        onSave={handleSubmit}
        loading={modalLoading}
      >
        <form>
          <div className="mb-3">
            <label className="form-label">Name *</label>
            <input
              type="text"
              className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter customer name"
            />
            {formErrors.name && (
              <div className="invalid-feedback">{formErrors.name}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Email *</label>
            <input
              type="email"
              className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email address"
            />
            {formErrors.email && (
              <div className="invalid-feedback">{formErrors.email}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter phone number"
            />
            {formErrors.phone && (
              <div className="invalid-feedback">{formErrors.phone}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Address *</label>
            <textarea
              className={`form-control ${formErrors.address ? 'is-invalid' : ''}`}
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter customer address"
              rows="3"
            />
            {formErrors.address && (
              <div className="invalid-feedback">{formErrors.address}</div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomerList;
