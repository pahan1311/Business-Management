import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema } from '../../../utils/validators';
import { USER_ROLES, USER_STATUS } from '../../../utils/constants';

const UserForm = ({
  user = null,
  onSubmit = () => {},
  isLoading = false,
  onCancel = () => {},
  className = ""
}) => {
  const isEditMode = !!user;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      role: user?.role || USER_ROLES.CUSTOMER,
      status: user?.status || USER_STATUS.ACTIVE,
      password: '',
      confirmPassword: '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      zipCode: user?.zipCode || '',
      emergencyContact: user?.emergencyContact || '',
      emergencyPhone: user?.emergencyPhone || '',
      licenseNumber: user?.licenseNumber || '',
      vehicleInfo: user?.vehicleInfo || ''
    },
  });

  const selectedRole = watch('role');
  const selectedStatus = watch('status');

  const roles = [
    { value: USER_ROLES.ADMIN, label: 'Administrator', icon: 'shield-check', color: 'danger' },
    { value: USER_ROLES.STAFF, label: 'Staff Member', icon: 'person-badge', color: 'primary' },
    { value: USER_ROLES.DELIVERY, label: 'Delivery Driver', icon: 'truck', color: 'warning' },
    { value: USER_ROLES.CUSTOMER, label: 'Customer', icon: 'person', color: 'success' },
  ];

  const statuses = [
    { value: USER_STATUS.ACTIVE, label: 'Active', color: 'success' },
    { value: USER_STATUS.INACTIVE, label: 'Inactive', color: 'secondary' },
    { value: USER_STATUS.SUSPENDED, label: 'Suspended', color: 'danger' },
    { value: USER_STATUS.PENDING, label: 'Pending Verification', color: 'warning' },
  ];

  const getRoleConfig = (role) => {
    return roles.find(r => r.value === role) || roles[3]; // Default to customer
  };

  const getStatusConfig = (status) => {
    return statuses.find(s => s.value === status) || statuses[0]; // Default to active
  };

  const roleConfig = getRoleConfig(selectedRole);
  const statusConfig = getStatusConfig(selectedStatus);

  const isDeliveryDriver = selectedRole === USER_ROLES.DELIVERY;
  const showPasswordFields = !isEditMode || watch('password');

  return (
    <div className={`user-form ${className}`}>
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">
            <i className={`bi bi-${roleConfig.icon} text-${roleConfig.color} me-2`}></i>
            {isEditMode ? 'Edit User' : 'Create New User'}
          </h6>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Current Role & Status Display */}
            <div className="mb-3">
              <span className={`badge bg-${roleConfig.color} me-2`}>
                <i className={`bi bi-${roleConfig.icon} me-1`}></i>
                {roleConfig.label}
              </span>
              <span className={`badge bg-${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>

            {/* Basic Information */}
            <div className="row">
              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <input
                    type="text"
                    className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                    id="firstName"
                    placeholder="First Name"
                    {...register('firstName')}
                  />
                  <label htmlFor="firstName">First Name</label>
                  {errors.firstName && (
                    <div className="invalid-feedback">{errors.firstName.message}</div>
                  )}
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <input
                    type="text"
                    className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                    id="lastName"
                    placeholder="Last Name"
                    {...register('lastName')}
                  />
                  <label htmlFor="lastName">Last Name</label>
                  {errors.lastName && (
                    <div className="invalid-feedback">{errors.lastName.message}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    id="email"
                    placeholder="email@example.com"
                    {...register('email')}
                  />
                  <label htmlFor="email">Email Address</label>
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email.message}</div>
                  )}
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <input
                    type="tel"
                    className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                    id="phone"
                    placeholder="Phone Number"
                    {...register('phone')}
                  />
                  <label htmlFor="phone">Phone Number</label>
                  {errors.phone && (
                    <div className="invalid-feedback">{errors.phone.message}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Role and Status */}
            <div className="row">
              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className={`form-select ${errors.role ? 'is-invalid' : ''}`}
                        id="role"
                      >
                        {roles.map(role => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <label htmlFor="role">Role</label>
                  {errors.role && (
                    <div className="invalid-feedback">{errors.role.message}</div>
                  )}
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                        id="status"
                      >
                        {statuses.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <label htmlFor="status">Status</label>
                  {errors.status && (
                    <div className="invalid-feedback">{errors.status.message}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Password Fields */}
            {!isEditMode && (
              <>
                <div className="row">
                  <div className="col-md-6">
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
                  </div>

                  <div className="col-md-6">
                    <div className="form-floating mb-3">
                      <input
                        type="password"
                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        id="confirmPassword"
                        placeholder="Confirm Password"
                        {...register('confirmPassword')}
                      />
                      <label htmlFor="confirmPassword">Confirm Password</label>
                      {errors.confirmPassword && (
                        <div className="invalid-feedback">{errors.confirmPassword.message}</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Address Information */}
            <div className="form-floating mb-3">
              <textarea
                className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                id="address"
                placeholder="Street Address"
                style={{ height: '80px' }}
                {...register('address')}
              ></textarea>
              <label htmlFor="address">Street Address</label>
              {errors.address && (
                <div className="invalid-feedback">{errors.address.message}</div>
              )}
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="form-floating mb-3">
                  <input
                    type="text"
                    className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                    id="city"
                    placeholder="City"
                    {...register('city')}
                  />
                  <label htmlFor="city">City</label>
                  {errors.city && (
                    <div className="invalid-feedback">{errors.city.message}</div>
                  )}
                </div>
              </div>

              <div className="col-md-4">
                <div className="form-floating mb-3">
                  <input
                    type="text"
                    className={`form-control ${errors.state ? 'is-invalid' : ''}`}
                    id="state"
                    placeholder="State"
                    {...register('state')}
                  />
                  <label htmlFor="state">State</label>
                  {errors.state && (
                    <div className="invalid-feedback">{errors.state.message}</div>
                  )}
                </div>
              </div>

              <div className="col-md-4">
                <div className="form-floating mb-3">
                  <input
                    type="text"
                    className={`form-control ${errors.zipCode ? 'is-invalid' : ''}`}
                    id="zipCode"
                    placeholder="ZIP Code"
                    {...register('zipCode')}
                  />
                  <label htmlFor="zipCode">ZIP Code</label>
                  {errors.zipCode && (
                    <div className="invalid-feedback">{errors.zipCode.message}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="row">
              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <input
                    type="text"
                    className="form-control"
                    id="emergencyContact"
                    placeholder="Emergency Contact Name"
                    {...register('emergencyContact')}
                  />
                  <label htmlFor="emergencyContact">Emergency Contact</label>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <input
                    type="tel"
                    className="form-control"
                    id="emergencyPhone"
                    placeholder="Emergency Contact Phone"
                    {...register('emergencyPhone')}
                  />
                  <label htmlFor="emergencyPhone">Emergency Phone</label>
                </div>
              </div>
            </div>

            {/* Delivery Driver Specific Fields */}
            {isDeliveryDriver && (
              <>
                <div className="alert alert-info">
                  <i className="bi bi-truck me-2"></i>
                  <strong>Driver Information</strong> - Additional details required for delivery drivers
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-floating mb-3">
                      <input
                        type="text"
                        className={`form-control ${errors.licenseNumber ? 'is-invalid' : ''}`}
                        id="licenseNumber"
                        placeholder="License Number"
                        {...register('licenseNumber')}
                      />
                      <label htmlFor="licenseNumber">Driver License Number</label>
                      {errors.licenseNumber && (
                        <div className="invalid-feedback">{errors.licenseNumber.message}</div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-floating mb-3">
                      <input
                        type="text"
                        className="form-control"
                        id="vehicleInfo"
                        placeholder="Vehicle Information"
                        {...register('vehicleInfo')}
                      />
                      <label htmlFor="vehicleInfo">Vehicle Info (Make, Model, Year)</label>
                    </div>
                  </div>
                </div>
              </>
            )}

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
                className={`btn btn-${roleConfig.color}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <i className={`bi bi-${isEditMode ? 'check-circle' : 'person-plus'} me-2`}></i>
                    {isEditMode ? 'Update User' : 'Create User'}
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

export default UserForm;
