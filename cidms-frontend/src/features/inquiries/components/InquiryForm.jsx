import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inquirySchema } from '../../../utils/validators';
import { INQUIRY_TYPES, INQUIRY_PRIORITIES } from '../../../utils/constants';
import FileUploader from '../../../components/common/FileUploader';

const InquiryForm = ({
  onSubmit = () => {},
  isLoading = false,
  onCancel = () => {},
  className = "",
  showPriority = true
}) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      type: INQUIRY_TYPES.GENERAL,
      priority: INQUIRY_PRIORITIES.MEDIUM,
      subject: '',
      message: '',
      customerEmail: '',
      customerPhone: '',
      attachments: []
    },
  });

  const inquiryType = watch('type');
  const priority = watch('priority');

  const inquiryTypes = [
    { value: INQUIRY_TYPES.GENERAL, label: 'General Inquiry', icon: 'chat-dots' },
    { value: INQUIRY_TYPES.ORDER, label: 'Order Related', icon: 'box-seam' },
    { value: INQUIRY_TYPES.DELIVERY, label: 'Delivery Issue', icon: 'truck' },
    { value: INQUIRY_TYPES.PRODUCT, label: 'Product Information', icon: 'info-circle' },
    { value: INQUIRY_TYPES.BILLING, label: 'Billing Support', icon: 'credit-card' },
    { value: INQUIRY_TYPES.COMPLAINT, label: 'Complaint', icon: 'exclamation-triangle' },
    { value: INQUIRY_TYPES.FEEDBACK, label: 'Feedback', icon: 'star' },
  ];

  const priorities = [
    { value: INQUIRY_PRIORITIES.LOW, label: 'Low', color: 'success' },
    { value: INQUIRY_PRIORITIES.MEDIUM, label: 'Medium', color: 'warning' },
    { value: INQUIRY_PRIORITIES.HIGH, label: 'High', color: 'danger' },
    { value: INQUIRY_PRIORITIES.URGENT, label: 'Urgent', color: 'danger' },
  ];

  const getTypeConfig = (type) => {
    const config = inquiryTypes.find(t => t.value === type);
    return config || inquiryTypes[0];
  };

  const getPriorityConfig = (priority) => {
    const config = priorities.find(p => p.value === priority);
    return config || priorities[1]; // Default to medium
  };

  const handleFileChange = (files) => {
    setValue('attachments', files);
  };

  const typeConfig = getTypeConfig(inquiryType);
  const priorityConfig = getPriorityConfig(priority);

  return (
    <div className={`inquiry-form ${className}`}>
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">
            <i className={`bi bi-${typeConfig.icon} me-2`}></i>
            Submit Inquiry
          </h6>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="row">
              {/* Inquiry Type */}
              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className={`form-select ${errors.type ? 'is-invalid' : ''}`}
                        id="type"
                      >
                        {inquiryTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <label htmlFor="type">Inquiry Type</label>
                  {errors.type && (
                    <div className="invalid-feedback">{errors.type.message}</div>
                  )}
                </div>
              </div>

              {/* Priority */}
              {showPriority && (
                <div className="col-md-6">
                  <div className="form-floating mb-3">
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className={`form-select ${errors.priority ? 'is-invalid' : ''}`}
                          id="priority"
                        >
                          {priorities.map(priority => (
                            <option key={priority.value} value={priority.value}>
                              {priority.label}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    <label htmlFor="priority">Priority</label>
                    {errors.priority && (
                      <div className="invalid-feedback">{errors.priority.message}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current Priority Indicator */}
            {showPriority && (
              <div className="mb-3">
                <span className={`badge bg-${priorityConfig.color} fs-6`}>
                  Priority: {priorityConfig.label}
                </span>
              </div>
            )}

            {/* Contact Information */}
            <div className="row">
              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className={`form-control ${errors.customerEmail ? 'is-invalid' : ''}`}
                    id="customerEmail"
                    placeholder="email@example.com"
                    {...register('customerEmail')}
                  />
                  <label htmlFor="customerEmail">Email Address</label>
                  {errors.customerEmail && (
                    <div className="invalid-feedback">{errors.customerEmail.message}</div>
                  )}
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <input
                    type="tel"
                    className={`form-control ${errors.customerPhone ? 'is-invalid' : ''}`}
                    id="customerPhone"
                    placeholder="Phone Number"
                    {...register('customerPhone')}
                  />
                  <label htmlFor="customerPhone">Phone Number (Optional)</label>
                  {errors.customerPhone && (
                    <div className="invalid-feedback">{errors.customerPhone.message}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Subject */}
            <div className="form-floating mb-3">
              <input
                type="text"
                className={`form-control ${errors.subject ? 'is-invalid' : ''}`}
                id="subject"
                placeholder="Subject"
                {...register('subject')}
              />
              <label htmlFor="subject">Subject</label>
              {errors.subject && (
                <div className="invalid-feedback">{errors.subject.message}</div>
              )}
            </div>

            {/* Message */}
            <div className="form-floating mb-3">
              <textarea
                className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                id="message"
                placeholder="Your message"
                style={{ height: '150px' }}
                {...register('message')}
              ></textarea>
              <label htmlFor="message">Message</label>
              {errors.message && (
                <div className="invalid-feedback">{errors.message.message}</div>
              )}
            </div>

            {/* File Attachments */}
            <div className="mb-3">
              <label className="form-label">Attachments (Optional)</label>
              <FileUploader
                onFilesChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
                maxSize={5 * 1024 * 1024} // 5MB
                maxFiles={3}
                multiple={true}
              />
              <div className="form-text">
                You can attach up to 3 files (images, PDF, or documents). Maximum size: 5MB per file.
              </div>
            </div>

            {/* Type-specific hints */}
            {inquiryType === INQUIRY_TYPES.ORDER && (
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                Please include your order number or relevant order details in your message.
              </div>
            )}

            {inquiryType === INQUIRY_TYPES.DELIVERY && (
              <div className="alert alert-info">
                <i className="bi bi-truck me-2"></i>
                Please provide your tracking number and delivery address for faster assistance.
              </div>
            )}

            {inquiryType === INQUIRY_TYPES.COMPLAINT && (
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                We take all complaints seriously. Please provide as much detail as possible.
              </div>
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
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    Submit Inquiry
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

export default InquiryForm;
