import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import { isValidEmail } from '../utils/helpers';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated, user } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    const redirectPath = user.role === 'admin' ? '/admin' :
                        user.role === 'customer' ? '/customer' :
                        user.role === 'staff' ? '/staff' :
                        user.role === 'delivery' ? '/delivery' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (!result.success) {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      setErrors({ submit: 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <i className="bi bi-box-seam fs-1 text-primary"></i>
                  <h2 className="mt-2">Order Management</h2>
                  <p className="text-muted">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      disabled={loading}
                    />
                    {errors.email && (
                      <div className="invalid-feedback">
                        {errors.email}
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <input
                      type="password"
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                    {errors.password && (
                      <div className="invalid-feedback">
                        {errors.password}
                      </div>
                    )}
                  </div>

                  {errors.submit && (
                    <div className="alert alert-danger mb-3" role="alert">
                      <i className="bi bi-exclamation-circle me-2"></i>
                      {errors.submit}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100 mb-3"
                    loading={loading}
                  >
                    Sign In
                  </Button>
                </form>

                <div className="text-center">
                  <p className="mb-0">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary text-decoration-none">
                      Sign up
                    </Link>
                  </p>
                </div>

                <hr className="my-4" />

                <div className="text-center">
                  <h6 className="text-muted mb-2">Demo Accounts</h6>
                  <div className="row g-2">
                    <div className="col-4">
                      <small className="d-block text-muted">
                        <strong>Admin:</strong><br />
                        admin@demo.com<br />
                        password
                      </small>
                    </div>
                    <div className="col-4">
                      <small className="d-block text-muted">
                        <strong>Customer:</strong><br />
                        customer@demo.com<br />
                        password
                      </small>
                    </div>
                    <div className="col-4">
                      <small className="d-block text-muted">
                        <strong>Delivery:</strong><br />
                        delivery@demo.com<br />
                        password
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
