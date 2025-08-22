import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Table, Alert } from 'react-bootstrap';
import { staffAPI } from '../../../services/api';
import LoadingSpinner from '../../common/LoadingSpinner';

const StaffList = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    phone: '',
    department: '',
    position: '',
    hireDate: '',
    status: 'active'
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await staffAPI.getAll();
      setStaff(response.data);
    } catch (err) {
      setError('Failed to fetch staff data. Please try again.');
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (currentStaff) {
        await staffAPI.update(currentStaff._id, formData);
      } else {
        await staffAPI.create(formData);
      }
      
      fetchStaff();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save staff member');
      console.error('Error saving staff:', err);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        setLoading(true);
        await staffAPI.delete(id);
        fetchStaff();
      } catch (err) {
        setError('Failed to delete staff member');
        console.error('Error deleting staff:', err);
        setLoading(false);
      }
    }
  };

  const handleEdit = (staffMember) => {
    setCurrentStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      role: staffMember.role || 'staff',
      phone: staffMember.phone || '',
      department: staffMember.department || '',
      position: staffMember.position || '',
      hireDate: staffMember.hireDate ? new Date(staffMember.hireDate).toISOString().split('T')[0] : '',
      status: staffMember.status || 'active'
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setCurrentStaff(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      phone: '',
      department: '',
      position: '',
      hireDate: '',
      status: 'active'
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentStaff(null);
  };

  if (loading && staff.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Staff Management</h2>
        <Button variant="primary" onClick={handleAdd}>
          <i className="bi bi-plus"></i> Add New Staff
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Phone</th>
            <th>Department</th>
            <th>Position</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.length > 0 ? (
            staff.map((staffMember, index) => (
              <tr key={staffMember._id}>
                <td>{index + 1}</td>
                <td>{staffMember.name}</td>
                <td>{staffMember.email}</td>
                <td>{staffMember.role}</td>
                <td>{staffMember.phone || '-'}</td>
                <td>{staffMember.department || '-'}</td>
                <td>{staffMember.position || '-'}</td>
                <td>
                  <span className={`badge bg-${staffMember.status === 'active' ? 'success' : 'danger'}`}>
                    {staffMember.status || 'active'}
                  </span>
                </td>
                <td>
                  <Button variant="info" size="sm" className="me-2" onClick={() => handleEdit(staffMember)}>
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(staffMember._id)}>
                    <i className="bi bi-trash"></i>
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="text-center">No staff members found</td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Add/Edit Staff Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{currentStaff ? 'Edit Staff' : 'Add New Staff'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>

            {!currentStaff && (
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select name="role" value={formData.role} onChange={handleChange}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                <option value="delivery">Delivery</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Department</Form.Label>
              <Form.Control
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Position</Form.Label>
              <Form.Control
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Hire Date</Form.Label>
              <Form.Control
                type="date"
                name="hireDate"
                value={formData.hireDate}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select name="status" value={formData.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffList;
