import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLoginMutation } from '../api';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../authSlice';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginForm = () => {
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      const result = await login(data).unwrap();
      dispatch(setCredentials(result));
      
      // Redirect based on user role
      const userRole = result.user.role;
      console.log('Login successful - User role:', userRole);
      
      let dashboardPath;
      
      if (userRole === 'ADMIN') {
        dashboardPath = '/admin/dashboard';
        console.log('Redirecting to Admin dashboard');
      } else if (userRole === 'STAFF') {
        dashboardPath = '/staff/dashboard';
        console.log('Redirecting to Staff dashboard');
      } else if (userRole === 'DELIVERY') {
        dashboardPath = '/delivery/dashboard';
        console.log('Redirecting to Delivery dashboard');
      } else if (userRole === 'CUSTOMER') {
        dashboardPath = '/customer/dashboard';
        console.log('Redirecting to Customer dashboard');
      } else {
        dashboardPath = '/';
        console.log('Unknown role, redirecting to root');
      }
      
      enqueueSnackbar(`Login successful as ${userRole}`, { variant: 'success' });
      navigate(dashboardPath, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      enqueueSnackbar(error.data?.message || 'Login failed', { variant: 'error' });
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-4">
        <div className="card">
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <h2 className="card-title">Sign In</h2>
              <p className="text-muted">Access your CIDMS account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-floating mb-3">
                <input
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  id="email"
                  placeholder="name@example.com"
                  {...register('email')}
                />
                <label htmlFor="email">Email address</label>
                {errors.email && (
                  <div className="invalid-feedback">{errors.email.message}</div>
                )}
              </div>

              <div className="form-floating mb-3">
                <input
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  id="password"
                  placeholder="Password"
                  {...register('password')}
                />
                <label htmlFor="password">Password</label>
                {errors.password && (
                  <div className="invalid-feedback">{errors.password.message}</div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="text-center mt-3">
                <p className="mb-0">
                  Don't have an account? <Link to="/signup" className="text-primary fw-bold">Sign Up</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
