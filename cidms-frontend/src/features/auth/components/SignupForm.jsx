import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegisterMutation } from '../api';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(5, 'Phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['CUSTOMER', 'STAFF', 'DELIVERY', 'ADMIN']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const SignupForm = () => {
  const [register, { isLoading }] = useRegisterMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'CUSTOMER'
    }
  });

  const onSubmit = async (data) => {
    try {
      // Remove confirm password before sending to API
      const { confirmPassword, ...userData } = data;
      
      const result = await register(userData).unwrap();
      dispatch(setCredentials(result));
      
      // Redirect based on role
      let redirectPath = '/';
      switch (result.user.role) {
        case 'ADMIN':
          redirectPath = '/admin';
          break;
        case 'STAFF':
          redirectPath = '/staff';
          break;
        case 'DELIVERY':
          redirectPath = '/delivery';
          break;
        case 'CUSTOMER':
          redirectPath = '/customer';
          break;
        default:
          redirectPath = '/';
      }
      
      navigate(redirectPath, { replace: true });
      enqueueSnackbar('Registration successful!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.data?.message || 'Registration failed', { variant: 'error' });
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card shadow">
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <h3 className="mb-0 fw-bold">Create Account</h3>
              <p className="text-muted">Enter your details to sign up</p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Full Name</label>
                <input
                  id="name"
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  {...registerField('name')}
                />
                {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  id="email"
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  {...registerField('email')}
                />
                {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="phone" className="form-label">Phone Number</label>
                <input
                  id="phone"
                  type="text"
                  className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                  {...registerField('phone')}
                />
                {errors.phone && <div className="invalid-feedback">{errors.phone.message}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="role" className="form-label">Account Type</label>
                <select
                  id="role"
                  className={`form-select ${errors.role ? 'is-invalid' : ''}`}
                  {...registerField('role')}
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="STAFF">Staff</option>
                  <option value="DELIVERY">Delivery Partner</option>
                  <option value="ADMIN">Administrator</option>
                </select>
                {errors.role && <div className="invalid-feedback">{errors.role.message}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  id="password"
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  {...registerField('password')}
                />
                {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
              </div>

              <div className="mb-4">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  {...registerField('confirmPassword')}
                />
                {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword.message}</div>}
              </div>

              <div className="d-grid mb-3">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating Account...
                    </>
                  ) : 'Sign Up'}
                </button>
              </div>
              
              <div className="text-center">
                <p className="mb-0">
                  Already have an account? <Link to="/login" className="text-primary fw-bold">Sign In</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
