import React, { useState } from 'react';
import { inquiryAPI } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import Button from '../../common/Button';
import { isValidEmail } from '../../../utils/helpers';

const InquiryForm = ({ onSubmit }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium',
    category: 'general'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'order', label: 'Order Related' },
    { value: 'delivery', label: 'Delivery Issue' },
    { value: 'payment', label: 'Payment Issue' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'feedback', label: 'Feedback' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const inquiryData = {
        ...formData,
        customerId: user.id,
        customerName: user.name,
        customerEmail: user.email,
        status: 'open'
      };

      await inquiryAPI.create(inquiryData);
      setSuccess(true);
      setFormData({
        subject: '',
        message: '',
        priority: 'medium',
        category: 'general'
      });

      if (onSubmit) {
        onSubmit();
      }

      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      setErrors({ submit: 'Failed to submit inquiry. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="bi bi-chat-dots me-2"></i>
                Submit Inquiry
              </h4>
            </div>
            <div className="card-body">
              {success && (
                <div className="alert alert-success" role="alert">
                  <i className="bi bi-check-circle me-2"></i>
                  Your inquiry has been submitted successfully! We'll get back to you soon.
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Category *</label>
                      <select
                        className="form-select"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-select"
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        {priorities.map(priority => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Subject *</label>
                  <input
                    type="text"
                    className={`form-control ${errors.subject ? 'is-invalid' : ''}`}
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Brief description of your inquiry"
                    disabled={loading}
                  />
                  {errors.subject && (
                    <div className="invalid-feedback">{errors.subject}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Message *</label>
                  <textarea
                    className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Please describe your inquiry in detail..."
                    rows="5"
                    disabled={loading}
                  />
                  {errors.message && (
                    <div className="invalid-feedback">{errors.message}</div>
                  )}
                  <div className="form-text">
                    Minimum 10 characters ({formData.message.length} characters)
                  </div>
                </div>

                {errors.submit && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {errors.submit}
                  </div>
                )}

                <div className="d-flex justify-content-end gap-2">
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => {
                      setFormData({
                        subject: '',
                        message: '',
                        priority: 'medium',
                        category: 'general'
                      });
                      setErrors({});
                    }}
                    disabled={loading}
                  >
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                  >
                    Submit Inquiry
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card mt-4">
            <div className="card-header">
              <h6 className="mb-0">Other Ways to Reach Us</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 text-center">
                  <i className="bi bi-telephone fs-2 text-primary mb-2 d-block"></i>
                  <h6>Phone</h6>
                  <p className="text-muted">+1 (555) 123-4567</p>
                </div>
                <div className="col-md-4 text-center">
                  <i className="bi bi-envelope fs-2 text-primary mb-2 d-block"></i>
                  <h6>Email</h6>
                  <p className="text-muted">support@company.com</p>
                </div>
                <div className="col-md-4 text-center">
                  <i className="bi bi-clock fs-2 text-primary mb-2 d-block"></i>
                  <h6>Hours</h6>
                  <p className="text-muted">Mon-Fri: 9AM-6PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryForm;
