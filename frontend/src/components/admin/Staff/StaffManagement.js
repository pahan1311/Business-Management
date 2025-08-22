import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import StatusBadge from '../../common/StatusBadge';
import { formatDate } from '../../../utils/helpers';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [filters, setFilters] = useState({
    department: 'all',
    status: 'all',
    role: 'all',
    search: ''
  });

  const [staffForm, setStaffForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    salary: '',
    hireDate: '',
    status: 'active',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    skills: [],
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const roles = [
    'Manager',
    'Supervisor',
    'Kitchen Staff',
    'Cashier',
    'Delivery Driver',
    'Inventory Clerk',
    'Customer Service',
    'Maintenance',
    'Security',
    'Part-time Staff'
  ];

  useEffect(() => {
    fetchStaff();
    fetchDepartments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [staff, filters]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/admin/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiService.get('/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      // Set default departments if API fails
      setDepartments([
        { id: '1', name: 'Kitchen' },
        { id: '2', name: 'Service' },
        { id: '3', name: 'Delivery' },
        { id: '4', name: 'Management' },
        { id: '5', name: 'Maintenance' }
      ]);
    }
  };

  const applyFilters = () => {
    let filtered = [...staff];

    if (filters.department !== 'all') {
      filtered = filtered.filter(member => member.department === filters.department);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(member => member.status === filters.status);
    }

    if (filters.role !== 'all') {
      filtered = filtered.filter(member => member.role === filters.role);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(member =>
        member.name?.toLowerCase().includes(searchTerm) ||
        member.email?.toLowerCase().includes(searchTerm) ||
        member.phone?.includes(searchTerm) ||
        member.employeeId?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredStaff(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setStaffForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setStaffForm(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setStaffForm(prev => ({
      ...prev,
      skills
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!staffForm.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!staffForm.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!staffForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(staffForm.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (!staffForm.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(staffForm.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!staffForm.role) {
      newErrors.role = 'Role is required';
    }

    if (!staffForm.department) {
      newErrors.department = 'Department is required';
    }

    if (!staffForm.hireDate) {
      newErrors.hireDate = 'Hire date is required';
    }

    if (staffForm.salary && isNaN(parseFloat(staffForm.salary))) {
      newErrors.salary = 'Please enter a valid salary amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const staffData = {
        ...staffForm,
        name: `${staffForm.firstName} ${staffForm.lastName}`,
        salary: parseFloat(staffForm.salary) || 0,
        createdAt: new Date().toISOString()
      };

      if (selectedStaff) {
        // Update existing staff
        await apiService.put(`/admin/staff/${selectedStaff.id}`, staffData);
        setStaff(prev => 
          prev.map(member => 
            member.id === selectedStaff.id 
              ? { ...member, ...staffData }
              : member
          )
        );
        setShowEditModal(false);
        alert('Staff member updated successfully!');
      } else {
        // Add new staff
        const response = await apiService.post('/admin/staff', staffData);
        setStaff(prev => [...prev, response.data]);
        setShowAddModal(false);
        alert('Staff member added successfully!');
      }

      // Reset form
      setStaffForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        salary: '',
        hireDate: '',
        status: 'active',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        },
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        skills: [],
        notes: ''
      });
      setSelectedStaff(null);
      setErrors({});
    } catch (error) {
      console.error('Failed to save staff member:', error);
      alert('Failed to save staff member. Please try again.');
    }
  };

  const handleEdit = (staffMember) => {
    setSelectedStaff(staffMember);
    setStaffForm({
      firstName: staffMember.name?.split(' ')[0] || '',
      lastName: staffMember.name?.split(' ').slice(1).join(' ') || '',
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      role: staffMember.role || '',
      department: staffMember.department || '',
      salary: staffMember.salary?.toString() || '',
      hireDate: staffMember.hireDate ? new Date(staffMember.hireDate).toISOString().split('T')[0] : '',
      status: staffMember.status || 'active',
      address: staffMember.address || {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      emergencyContact: staffMember.emergencyContact || {
        name: '',
        phone: '',
        relationship: ''
      },
      skills: staffMember.skills || [],
      notes: staffMember.notes || ''
    });
    setShowEditModal(true);
  };

  const handleStatusUpdate = async (staffId, newStatus) => {
    try {
      await apiService.put(`/admin/staff/${staffId}/status`, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      setStaff(prev => 
        prev.map(member => 
          member.id === staffId 
            ? { ...member, status: newStatus }
            : member
        )
      );
    } catch (error) {
      console.error('Failed to update staff status:', error);
      alert('Failed to update staff status');
    }
  };

  const handleDelete = async (staffId) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) {
      return;
    }

    try {
      await apiService.delete(`/admin/staff/${staffId}`);
      setStaff(prev => prev.filter(member => member.id !== staffId));
      alert('Staff member deleted successfully!');
    } catch (error) {
      console.error('Failed to delete staff member:', error);
      alert('Failed to delete staff member');
    }
  };

  const getStaffStats = () => {
    const total = staff.length;
    const active = staff.filter(s => s.status === 'active').length;
    const inactive = staff.filter(s => s.status === 'inactive').length;
    const onLeave = staff.filter(s => s.status === 'on_leave').length;

    return { total, active, inactive, onLeave };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'on_leave':
        return 'warning';
      case 'terminated':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const stats = getStaffStats();

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Staff Management</h4>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <i className="bi bi-person-plus me-2"></i>
              Add Staff Member
            </button>
          </div>

          {/* Stats Cards */}
          <div className="row">
            <div className="col-md-3">
              <div className="card text-center border-primary">
                <div className="card-body">
                  <h3 className="text-primary">{stats.total}</h3>
                  <small className="text-muted">Total Staff</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center border-success">
                <div className="card-body">
                  <h3 className="text-success">{stats.active}</h3>
                  <small className="text-muted">Active</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center border-warning">
                <div className="card-body">
                  <h3 className="text-warning">{stats.onLeave}</h3>
                  <small className="text-muted">On Leave</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center border-secondary">
                <div className="card-body">
                  <h3 className="text-secondary">{stats.inactive}</h3>
                  <small className="text-muted">Inactive</small>
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
            <div className="col-md-2">
              <label htmlFor="departmentFilter" className="form-label">Department</label>
              <select
                id="departmentFilter"
                className="form-select form-select-sm"
                value={filters.department}
                onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="statusFilter" className="form-label">Status</label>
              <select
                id="statusFilter"
                className="form-select form-select-sm"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="roleFilter" className="form-label">Role</label>
              <select
                id="roleFilter"
                className="form-select form-select-sm"
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="searchFilter" className="form-label">Search</label>
              <input
                type="text"
                id="searchFilter"
                className="form-control form-control-sm"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by name, email, phone, or employee ID..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people display-1 text-muted"></i>
              <h5 className="mt-3">No staff members found</h5>
              <p className="text-muted">No staff members match the selected filters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role & Department</th>
                    <th>Contact</th>
                    <th>Hire Date</th>
                    <th>Salary</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map(member => (
                    <tr key={member.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                               style={{ width: '40px', height: '40px' }}>
                            <i className="bi bi-person"></i>
                          </div>
                          <div>
                            <div className="fw-bold">{member.name}</div>
                            <small className="text-muted">ID: {member.employeeId || 'N/A'}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="fw-bold">{member.role}</div>
                          <small className="text-muted">{member.department}</small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{member.email}</div>
                          <small className="text-muted">{member.phone}</small>
                        </div>
                      </td>
                      <td>{formatDate(member.hireDate)}</td>
                      <td>
                        {member.salary ? `$${member.salary.toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="text-center">
                        <StatusBadge 
                          status={member.status} 
                          className={`bg-${getStatusColor(member.status)}`}
                        />
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-primary"
                            onClick={() => handleEdit(member)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <div className="dropdown">
                            <button 
                              className="btn btn-outline-secondary dropdown-toggle" 
                              type="button" 
                              data-bs-toggle="dropdown"
                            >
                              <i className="bi bi-gear"></i>
                            </button>
                            <ul className="dropdown-menu">
                              <li>
                                <button 
                                  className="dropdown-item"
                                  onClick={() => handleStatusUpdate(member.id, 
                                    member.status === 'active' ? 'inactive' : 'active')}
                                >
                                  {member.status === 'active' ? 'Deactivate' : 'Activate'}
                                </button>
                              </li>
                              <li>
                                <button 
                                  className="dropdown-item"
                                  onClick={() => handleStatusUpdate(member.id, 'on_leave')}
                                >
                                  Mark on Leave
                                </button>
                              </li>
                              <li><hr className="dropdown-divider" /></li>
                              <li>
                                <button 
                                  className="dropdown-item text-danger"
                                  onClick={() => handleDelete(member.id)}
                                >
                                  Delete
                                </button>
                              </li>
                            </ul>
                          </div>
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

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Staff Member</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  {/* Personal Information */}
                  <div className="mb-4">
                    <h6 className="text-muted mb-3">Personal Information</h6>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="firstName" className="form-label">
                          First Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                          value={staffForm.firstName}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.firstName && (
                          <div className="invalid-feedback">{errors.firstName}</div>
                        )}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="lastName" className="form-label">
                          Last Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                          value={staffForm.lastName}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.lastName && (
                          <div className="invalid-feedback">{errors.lastName}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="mb-4">
                    <h6 className="text-muted mb-3">Contact Information</h6>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="email" className="form-label">
                          Email <span className="text-danger">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                          value={staffForm.email}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.email && (
                          <div className="invalid-feedback">{errors.email}</div>
                        )}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="phone" className="form-label">
                          Phone <span className="text-danger">*</span>
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                          value={staffForm.phone}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.phone && (
                          <div className="invalid-feedback">{errors.phone}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Job Information */}
                  <div className="mb-4">
                    <h6 className="text-muted mb-3">Job Information</h6>
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label htmlFor="role" className="form-label">
                          Role <span className="text-danger">*</span>
                        </label>
                        <select
                          id="role"
                          name="role"
                          className={`form-select ${errors.role ? 'is-invalid' : ''}`}
                          value={staffForm.role}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select role</option>
                          {roles.map(role => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        {errors.role && (
                          <div className="invalid-feedback">{errors.role}</div>
                        )}
                      </div>
                      <div className="col-md-4 mb-3">
                        <label htmlFor="department" className="form-label">
                          Department <span className="text-danger">*</span>
                        </label>
                        <select
                          id="department"
                          name="department"
                          className={`form-select ${errors.department ? 'is-invalid' : ''}`}
                          value={staffForm.department}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select department</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.name}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                        {errors.department && (
                          <div className="invalid-feedback">{errors.department}</div>
                        )}
                      </div>
                      <div className="col-md-4 mb-3">
                        <label htmlFor="status" className="form-label">Status</label>
                        <select
                          id="status"
                          name="status"
                          className="form-select"
                          value={staffForm.status}
                          onChange={handleInputChange}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="on_leave">On Leave</option>
                        </select>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="hireDate" className="form-label">
                          Hire Date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          id="hireDate"
                          name="hireDate"
                          className={`form-control ${errors.hireDate ? 'is-invalid' : ''}`}
                          value={staffForm.hireDate}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.hireDate && (
                          <div className="invalid-feedback">{errors.hireDate}</div>
                        )}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="salary" className="form-label">Salary</label>
                        <input
                          type="number"
                          id="salary"
                          name="salary"
                          className={`form-control ${errors.salary ? 'is-invalid' : ''}`}
                          value={staffForm.salary}
                          onChange={handleInputChange}
                          placeholder="Annual salary"
                        />
                        {errors.salary && (
                          <div className="invalid-feedback">{errors.salary}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mb-4">
                    <label htmlFor="skills" className="form-label">Skills</label>
                    <input
                      type="text"
                      id="skills"
                      name="skills"
                      className="form-control"
                      value={staffForm.skills.join(', ')}
                      onChange={handleSkillsChange}
                      placeholder="Enter skills separated by commas"
                    />
                  </div>

                  {/* Notes */}
                  <div className="mb-4">
                    <label htmlFor="notes" className="form-label">Notes</label>
                    <textarea
                      id="notes"
                      name="notes"
                      className="form-control"
                      rows="3"
                      value={staffForm.notes}
                      onChange={handleInputChange}
                      placeholder="Additional notes or comments"
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                >
                  <i className="bi bi-person-plus me-2"></i>
                  Add Staff Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Staff Member</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Same form as Add Modal but pre-filled with data */}
                <form onSubmit={handleSubmit}>
                  {/* Personal Information */}
                  <div className="mb-4">
                    <h6 className="text-muted mb-3">Personal Information</h6>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="editFirstName" className="form-label">
                          First Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          id="editFirstName"
                          name="firstName"
                          className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                          value={staffForm.firstName}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.firstName && (
                          <div className="invalid-feedback">{errors.firstName}</div>
                        )}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="editLastName" className="form-label">
                          Last Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          id="editLastName"
                          name="lastName"
                          className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                          value={staffForm.lastName}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.lastName && (
                          <div className="invalid-feedback">{errors.lastName}</div>
                        )}
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="editEmail" className="form-label">
                          Email <span className="text-danger">*</span>
                        </label>
                        <input
                          type="email"
                          id="editEmail"
                          name="email"
                          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                          value={staffForm.email}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.email && (
                          <div className="invalid-feedback">{errors.email}</div>
                        )}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="editPhone" className="form-label">
                          Phone <span className="text-danger">*</span>
                        </label>
                        <input
                          type="tel"
                          id="editPhone"
                          name="phone"
                          className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                          value={staffForm.phone}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.phone && (
                          <div className="invalid-feedback">{errors.phone}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Job Information */}
                  <div className="mb-4">
                    <h6 className="text-muted mb-3">Job Information</h6>
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label htmlFor="editRole" className="form-label">
                          Role <span className="text-danger">*</span>
                        </label>
                        <select
                          id="editRole"
                          name="role"
                          className={`form-select ${errors.role ? 'is-invalid' : ''}`}
                          value={staffForm.role}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select role</option>
                          {roles.map(role => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        {errors.role && (
                          <div className="invalid-feedback">{errors.role}</div>
                        )}
                      </div>
                      <div className="col-md-4 mb-3">
                        <label htmlFor="editDepartment" className="form-label">
                          Department <span className="text-danger">*</span>
                        </label>
                        <select
                          id="editDepartment"
                          name="department"
                          className={`form-select ${errors.department ? 'is-invalid' : ''}`}
                          value={staffForm.department}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select department</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.name}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                        {errors.department && (
                          <div className="invalid-feedback">{errors.department}</div>
                        )}
                      </div>
                      <div className="col-md-4 mb-3">
                        <label htmlFor="editStatus" className="form-label">Status</label>
                        <select
                          id="editStatus"
                          name="status"
                          className="form-select"
                          value={staffForm.status}
                          onChange={handleInputChange}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="on_leave">On Leave</option>
                          <option value="terminated">Terminated</option>
                        </select>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="editHireDate" className="form-label">
                          Hire Date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          id="editHireDate"
                          name="hireDate"
                          className={`form-control ${errors.hireDate ? 'is-invalid' : ''}`}
                          value={staffForm.hireDate}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.hireDate && (
                          <div className="invalid-feedback">{errors.hireDate}</div>
                        )}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="editSalary" className="form-label">Salary</label>
                        <input
                          type="number"
                          id="editSalary"
                          name="salary"
                          className={`form-control ${errors.salary ? 'is-invalid' : ''}`}
                          value={staffForm.salary}
                          onChange={handleInputChange}
                          placeholder="Annual salary"
                        />
                        {errors.salary && (
                          <div className="invalid-feedback">{errors.salary}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mb-4">
                    <label htmlFor="editSkills" className="form-label">Skills</label>
                    <input
                      type="text"
                      id="editSkills"
                      name="skills"
                      className="form-control"
                      value={staffForm.skills.join(', ')}
                      onChange={handleSkillsChange}
                      placeholder="Enter skills separated by commas"
                    />
                  </div>

                  {/* Notes */}
                  <div className="mb-4">
                    <label htmlFor="editNotes" className="form-label">Notes</label>
                    <textarea
                      id="editNotes"
                      name="notes"
                      className="form-control"
                      rows="3"
                      value={staffForm.notes}
                      onChange={handleInputChange}
                      placeholder="Additional notes or comments"
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                >
                  <i className="bi bi-check-lg me-2"></i>
                  Update Staff Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
