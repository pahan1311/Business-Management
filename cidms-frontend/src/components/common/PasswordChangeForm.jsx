import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const PasswordChangeForm = ({
  onSubmit = () => {},
  isLoading = false,
  onCancel = () => {},
  className = ""
}) => {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
  });

  const newPassword = watch('newPassword');

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z\d]/.test(password)) score++;

    const configs = {
      0: { label: 'Very Weak', color: 'danger' },
      1: { label: 'Very Weak', color: 'danger' },
      2: { label: 'Weak', color: 'warning' },
      3: { label: 'Fair', color: 'warning' },
      4: { label: 'Good', color: 'info' },
      5: { label: 'Strong', color: 'success' },
      6: { label: 'Very Strong', color: 'success' }
    };

    return {
      strength: score,
      ...configs[score]
    };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
      reset(); // Clear form on success
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  return (
    <div className={`password-change-form ${className}`}>
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">
            <i className="bi bi-shield-lock text-primary me-2"></i>
            Change Password
          </h6>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            {/* Current Password */}
            <div className="form-floating mb-3">
              <div className="input-group">
                <div className="form-floating">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`}
                    id="currentPassword"
                    placeholder="Current Password"
                    {...register('currentPassword')}
                  />
                  <label htmlFor="currentPassword">Current Password</label>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  <i className={`bi bi-eye${showPasswords.current ? '-slash' : ''}`}></i>
                </button>
              </div>
              {errors.currentPassword && (
                <div className="invalid-feedback d-block">{errors.currentPassword.message}</div>
              )}
            </div>

            {/* New Password */}
            <div className="form-floating mb-3">
              <div className="input-group">
                <div className="form-floating">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                    id="newPassword"
                    placeholder="New Password"
                    {...register('newPassword')}
                  />
                  <label htmlFor="newPassword">New Password</label>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  <i className={`bi bi-eye${showPasswords.new ? '-slash' : ''}`}></i>
                </button>
              </div>
              {errors.newPassword && (
                <div className="invalid-feedback d-block">{errors.newPassword.message}</div>
              )}
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="text-muted">Password Strength:</small>
                  <span className={`badge bg-${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="progress" style={{ height: '4px' }}>
                  <div
                    className={`progress-bar bg-${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div className="form-floating mb-3">
              <div className="input-group">
                <div className="form-floating">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    id="confirmPassword"
                    placeholder="Confirm New Password"
                    {...register('confirmPassword')}
                  />
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  <i className={`bi bi-eye${showPasswords.confirm ? '-slash' : ''}`}></i>
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="invalid-feedback d-block">{errors.confirmPassword.message}</div>
              )}
            </div>

            {/* Password Requirements */}
            <div className="alert alert-info">
              <h6 className="alert-heading">
                <i className="bi bi-info-circle me-2"></i>
                Password Requirements
              </h6>
              <ul className="mb-0 small">
                <li>At least 8 characters long</li>
                <li>Contains at least one uppercase letter (A-Z)</li>
                <li>Contains at least one lowercase letter (a-z)</li>
                <li>Contains at least one number (0-9)</li>
                <li>Special characters are recommended for stronger security</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Changing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-shield-check me-2"></i>
                    Change Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeForm;
