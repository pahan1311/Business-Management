import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema } from '../../../utils/validators';

const CustomerForm = ({ customer, onSubmit, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: customer || {
      name: '',
      email: '',
      phone: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
      },
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="row">
        {/* Personal Information */}
        <div className="col-lg-6">
          <h6 className="mb-3">Personal Information</h6>
          
          <div className="form-floating mb-3">
            <input
              type="text"
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              id="name"
              placeholder="Full Name"
              {...register('name')}
            />
            <label htmlFor="name">Full Name</label>
            {errors.name && (
              <div className="invalid-feedback">{errors.name.message}</div>
            )}
          </div>

          <div className="form-floating mb-3">
            <input
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              id="email"
              placeholder="Email Address"
              {...register('email')}
            />
            <label htmlFor="email">Email Address</label>
            {errors.email && (
              <div className="invalid-feedback">{errors.email.message}</div>
            )}
          </div>

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

        {/* Address Information */}
        <div className="col-lg-6">
          <h6 className="mb-3">Address Information</h6>
          
          <div className="form-floating mb-3">
            <input
              type="text"
              className={`form-control ${errors.address?.line1 ? 'is-invalid' : ''}`}
              id="addressLine1"
              placeholder="Address Line 1"
              {...register('address.line1')}
            />
            <label htmlFor="addressLine1">Address Line 1</label>
            {errors.address?.line1 && (
              <div className="invalid-feedback">{errors.address.line1.message}</div>
            )}
          </div>

          <div className="form-floating mb-3">
            <input
              type="text"
              className="form-control"
              id="addressLine2"
              placeholder="Address Line 2 (Optional)"
              {...register('address.line2')}
            />
            <label htmlFor="addressLine2">Address Line 2 (Optional)</label>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className={`form-control ${errors.address?.city ? 'is-invalid' : ''}`}
                  id="city"
                  placeholder="City"
                  {...register('address.city')}
                />
                <label htmlFor="city">City</label>
                {errors.address?.city && (
                  <div className="invalid-feedback">{errors.address.city.message}</div>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className={`form-control ${errors.address?.state ? 'is-invalid' : ''}`}
                  id="state"
                  placeholder="State"
                  {...register('address.state')}
                />
                <label htmlFor="state">State</label>
                {errors.address?.state && (
                  <div className="invalid-feedback">{errors.address.state.message}</div>
                )}
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className={`form-control ${errors.address?.postalCode ? 'is-invalid' : ''}`}
                  id="postalCode"
                  placeholder="Postal Code"
                  {...register('address.postalCode')}
                />
                <label htmlFor="postalCode">Postal Code</label>
                {errors.address?.postalCode && (
                  <div className="invalid-feedback">{errors.address.postalCode.message}</div>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-floating mb-3">
                <select
                  className={`form-select ${errors.address?.country ? 'is-invalid' : ''}`}
                  id="country"
                  {...register('address.country')}
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="MX">Mexico</option>
                </select>
                <label htmlFor="country">Country</label>
                {errors.address?.country && (
                  <div className="invalid-feedback">{errors.address.country.message}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="d-flex justify-content-end gap-2 mt-4">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => window.history.back()}
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
              Saving...
            </>
          ) : (
            'Save Customer'
          )}
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;
