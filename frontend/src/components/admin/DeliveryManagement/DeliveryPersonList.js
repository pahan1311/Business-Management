import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Modal, Form, Spinner } from 'react-bootstrap';
import { useCrud } from '../../../hooks/useApi';
import { userAPI } from '../../../services/api';
import { formatDate } from '../../../utils/helpers';

const DeliveryPersonList = () => {
  const {
    items: deliveryPersonnel,
    loading,
    error,
    fetchAll,
    create,
    update,
    remove
  } = useCrud(userAPI);

  const [showModal, setShowModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    }
  });
  const [formErrors, setFormErrors] = useState({});
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    // Fetch only delivery personnel
    const fetchData = async () => {
      try {
        console.log('Fetching delivery personnel');
        await fetchAll({ role: 'delivery' });
      } catch (error) {
        console.error('Error fetching delivery personnel:', error);
      }
    };
    
    fetchData();
    
    // Remove fetchAll from dependency array to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter delivery personnel based on search term
  // Ensure deliveryPersonnel is an array before filtering
  const filteredDeliveryPersonnel = Array.isArray(deliveryPersonnel) 
    ? deliveryPersonnel.filter(person =>
        person?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person?.phone?.includes(searchTerm)
      )
    : [];

  const handleAddPerson = () => {
    setSelectedPerson(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      address: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: ''
      }
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEditPerson = (person) => {
    setSelectedPerson(person);
    setFormData({
      name: person.name || '',
      email: person.email || '',
      phone: person.phone || '',
      password: '', // Leave password blank when editing
      address: {
        street: person.address?.street || '',
        city: person.address?.city || '',
        state: person.address?.state || '',
        zip: person.address?.zip || '',
        country: person.address?.country || ''
      }
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleDeletePerson = async (person) => {
    if (window.confirm(`Are you sure you want to delete delivery person ${person.name}?`)) {
      await remove(person._id);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }

    // Only validate password for new delivery personnel
    if (!selectedPerson && !formData.password) {
      errors.password = 'Password is required for new accounts';
    } else if (!selectedPerson && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setModalLoading(true);
    try {
      const userData = {
        ...formData,
        role: 'delivery' // Ensure the role is set to delivery
      };

      // Don't send empty password when updating
      if (selectedPerson && !userData.password) {
        delete userData.password;
      }

      if (selectedPerson) {
        await update(selectedPerson._id, userData);
      } else {
        await create(userData);
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save delivery person:', error);
      // Set general form error
      setFormErrors({
        ...formErrors,
        general: error.response?.data?.message || error.message || 'Failed to save delivery person'
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading delivery personnel...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Delivery Personnel Management</h2>
        <Button variant="primary" onClick={handleAddPerson}>
          <i className="bi bi-person-plus me-2"></i>
          Add Delivery Person
        </Button>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <div className="input-group">
          <span className="input-group-text">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading delivery personnel...</p>
        </div>
      ) : error ? (
        <div className="text-center py-5">
          <i className="bi bi-exclamation-triangle fs-1 text-danger"></i>
          <p className="mt-3">Error loading delivery personnel: {error}</p>
          <Button variant="outline-primary" onClick={() => fetchAll({ role: 'delivery' })}>
            Try Again
          </Button>
        </div>
      ) : filteredDeliveryPersonnel.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-people fs-1 text-muted"></i>
          <p className="mt-3">No delivery personnel found</p>
        </div>
      ) : (
        <div className="table-responsive">
          <Table hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact Info</th>
                <th>Address</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveryPersonnel.map(person => (
                <tr key={person._id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="avatar-circle bg-primary text-white me-2">
                        {person.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="fw-bold">{person.name}</div>
                        <div className="text-muted small">ID: {person._id.substring(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div><i className="bi bi-envelope me-2"></i>{person.email}</div>
                      <div><i className="bi bi-telephone me-2"></i>{person.phone || 'N/A'}</div>
                    </div>
                  </td>
                  <td>
                    {person.address?.street ? (
                      <div className="small">
                        <div>{person.address.street}</div>
                        <div>
                          {person.address.city}, {person.address.state} {person.address.zip}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted">No address provided</span>
                    )}
                  </td>
                  <td>
                    {formatDate(person.createdAt)}
                  </td>
                  <td>
                    <Badge bg="success">Active</Badge>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <Button variant="outline-primary" onClick={() => handleEditPerson(person)}>
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button variant="outline-danger" onClick={() => handleDeletePerson(person)}>
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedPerson ? 'Edit Delivery Person' : 'Add Delivery Person'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formErrors.general && (
            <div className="alert alert-danger">{formErrors.general}</div>
          )}
          
          <Form>
            <h5 className="mb-3">Personal Information</h5>
            
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                isInvalid={!!formErrors.name}
                placeholder="Enter full name"
              />
              <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.email}
                    placeholder="Enter email"
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
                </Form.Group>
              </div>
              
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.phone}
                    placeholder="Enter phone number"
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.phone}</Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-4">
              <Form.Label>
                {selectedPerson ? 'Password (Leave blank to keep current)' : 'Password'}
              </Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                isInvalid={!!formErrors.password}
                placeholder={selectedPerson ? "Enter new password (optional)" : "Enter password"}
              />
              <Form.Control.Feedback type="invalid">{formErrors.password}</Form.Control.Feedback>
            </Form.Group>

            <h5 className="mb-3">Address Information</h5>
            
            <Form.Group className="mb-3">
              <Form.Label>Street Address</Form.Label>
              <Form.Control
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleInputChange}
                placeholder="Enter street address"
              />
            </Form.Group>

            <div className="row">
              <div className="col-md-5">
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                  />
                </Form.Group>
              </div>
              
              <div className="col-md-3">
                <Form.Group className="mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    placeholder="Enter state"
                  />
                </Form.Group>
              </div>
              
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>ZIP Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.zip"
                    value={formData.address.zip}
                    onChange={handleInputChange}
                    placeholder="Enter ZIP code"
                  />
                </Form.Group>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={modalLoading}
          >
            {modalLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Saving...
              </>
            ) : (
              <>Save</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DeliveryPersonList;
