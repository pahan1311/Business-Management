import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
    companyName: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    agreeToTerms: false
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
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
        [name]: type === 'checkbox' ? checked : value
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

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Address validation
    if (!formData.address.street.trim()) {
      newErrors['address.street'] = 'Street address is required';
    }

    if (!formData.address.city.trim()) {
      newErrors['address.city'] = 'City is required';
    }

    if (!formData.address.state.trim()) {
      newErrors['address.state'] = 'State is required';
    }

    if (!formData.address.zipCode.trim()) {
      newErrors['address.zipCode'] = 'ZIP code is required';
    }

    // Terms agreement
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Transform frontend form data to match backend User model
      const userData = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };
      
      // Add optional fields only if they have values
      if (formData.phone) {
        userData.phone = formData.phone;
      }
      
      // Only add address if at least some fields are filled
      if (formData.address.street || formData.address.city) {
        userData.address = {
          street: formData.address.street || '',
          city: formData.address.city || '',
          state: formData.address.state || '',
          zip: formData.address.zipCode || '',
          country: formData.address.country || 'USA'
        };
      }
      
      console.log('Sending user data:', userData);

      const result = await authService.signup(userData);
      
      if (result.success) {
        // Show success message
        alert('Account created successfully! Please log in with your credentials.');
        
        // Redirect to login page
        navigate('/login');
      } else {
        // Show error message
        setErrors({ submit: result.error });
      }
    } catch (error) {
      console.error('Signup failed:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      setErrors({ submit: errorMessage });
      alert('Signup failed: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow">
              <div className="card-body p-4">
                {/* Header */}
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-primary">Create Account</h2>
                  <p className="text-muted">Join our order management system</p>
                </div>

                {/* General Error */}
                {errors.general && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {errors.general}
                  </div>
                )}

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
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="Enter your first name"
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
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Enter your last name"
                        />
                        {errors.lastName && (
                          <div className="invalid-feedback">{errors.lastName}</div>
                        )}
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="email" className="form-label">
                          Email Address <span className="text-danger">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter your email"
                        />
                        {errors.email && (
                          <div className="invalid-feedback">{errors.email}</div>
                        )}
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label htmlFor="phone" className="form-label">
                          Phone Number <span className="text-danger">*</span>
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="(555) 123-4567"
                        />
                        {errors.phone && (
                          <div className="invalid-feedback">{errors.phone}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Account Type */}
                  <div className="mb-4">
                    <h6 className="text-muted mb-3">Account Type</h6>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="role" className="form-label">Role</label>
                        <select
                          id="role"
                          name="role"
                          className="form-select"
                          value={formData.role}
                          onChange={handleInputChange}
                        >
                          <option value="customer">Customer</option>
                          <option value="staff">Staff Member</option>
                          <option value="delivery">Delivery Personnel</option>
                        </select>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label htmlFor="companyName" className="form-label">Company Name (Optional)</label>
                        <input
                          type="text"
                          id="companyName"
                          name="companyName"
                          className="form-control"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          placeholder="Enter company name"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="mb-4">
                    <h6 className="text-muted mb-3">Address Information</h6>
                    <div className="mb-3">
                      <label htmlFor="address.street" className="form-label">
                        Street Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        id="address.street"
                        name="address.street"
                        className={`form-control ${errors['address.street'] ? 'is-invalid' : ''}`}
                        value={formData.address.street}
                        onChange={handleInputChange}
                        placeholder="Enter street address"
                      />
                      {errors['address.street'] && (
                        <div className="invalid-feedback">{errors['address.street']}</div>
                      )}
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="address.city" className="form-label">
                          City <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          id="address.city"
                          name="address.city"
                          className={`form-control ${errors['address.city'] ? 'is-invalid' : ''}`}
                          value={formData.address.city}
                          onChange={handleInputChange}
                          placeholder="Enter city"
                        />
                        {errors['address.city'] && (
                          <div className="invalid-feedback">{errors['address.city']}</div>
                        )}
                      </div>
                      
                      <div className="col-md-3 mb-3">
                        <label htmlFor="address.state" className="form-label">
                          State <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          id="address.state"
                          name="address.state"
                          className={`form-control ${errors['address.state'] ? 'is-invalid' : ''}`}
                          value={formData.address.state}
                          onChange={handleInputChange}
                          placeholder="CA"
                          maxLength="2"
                        />
                        {errors['address.state'] && (
                          <div className="invalid-feedback">{errors['address.state']}</div>
                        )}
                      </div>
                      
                      <div className="col-md-3 mb-3">
                        <label htmlFor="address.zipCode" className="form-label">
                          ZIP Code <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          id="address.zipCode"
                          name="address.zipCode"
                          className={`form-control ${errors['address.zipCode'] ? 'is-invalid' : ''}`}
                          value={formData.address.zipCode}
                          onChange={handleInputChange}
                          placeholder="12345"
                        />
                        {errors['address.zipCode'] && (
                          <div className="invalid-feedback">{errors['address.zipCode']}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="mb-4">
                    <h6 className="text-muted mb-3">Security</h6>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="password" className="form-label">
                          Password <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Enter password"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                          </button>
                        </div>
                        {errors.password && (
                          <div className="invalid-feedback d-block">{errors.password}</div>
                        )}
                        <div className="form-text">
                          Password must be at least 8 characters with uppercase, lowercase, and number
                        </div>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label htmlFor="confirmPassword" className="form-label">
                          Confirm Password <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirm password"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            <i className={`bi bi-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <div className="invalid-feedback d-block">{errors.confirmPassword}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Terms Agreement */}
                  <div className="mb-4">
                    <div className="form-check">
                      <input
                        className={`form-check-input ${errors.agreeToTerms ? 'is-invalid' : ''}`}
                        type="checkbox"
                        id="agreeToTerms"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label" htmlFor="agreeToTerms">
                        I agree to the <button type="button" className="btn btn-link p-0 text-decoration-none border-0 align-baseline" onClick={() => window.open('/terms', '_blank')}>Terms of Service</button> and 
                        <button type="button" className="btn btn-link p-0 text-decoration-none border-0 align-baseline ms-1" onClick={() => window.open('/privacy', '_blank')}>Privacy Policy</button>
                        <span className="text-danger">*</span>
                      </label>
                      {errors.agreeToTerms && (
                        <div className="invalid-feedback d-block">{errors.agreeToTerms}</div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-plus me-2"></i>
                        Create Account
                      </>
                    )}
                  </button>

                  {/* Login Link */}
                  <div className="text-center">
                    <p className="text-muted mb-0">
                      Already have an account?{' '}
                      <Link to="/login" className="text-decoration-none fw-bold">
                        Sign In
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
