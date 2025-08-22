import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import StatusBadge from '../../common/StatusBadge';
import { formatDate, formatTime } from '../../../utils/helpers';

const IssueReporting = () => {
  const [issues, setIssues] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState('');
  const [issueForm, setIssueForm] = useState({
    deliveryId: '',
    issueType: '',
    priority: 'medium',
    description: '',
    location: '',
    contactedCustomer: false,
    resolutionAttempts: '',
    photos: [],
    estimatedDelay: 0
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchActiveDeliveries();
    fetchIssues();
  }, []);

  const fetchActiveDeliveries = async () => {
    try {
      const response = await apiService.get('/deliveries/active');
      setActiveDeliveries(response.data);
    } catch (error) {
      console.error('Failed to fetch active deliveries:', error);
    }
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/delivery-issues');
      setIssues(response.data);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setIssueForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDeliverySelect = (deliveryId) => {
    setSelectedDelivery(deliveryId);
    setIssueForm(prev => ({
      ...prev,
      deliveryId
    }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    // In a real app, you'd upload these to a file storage service
    setIssueForm(prev => ({
      ...prev,
      photos: [...prev.photos, ...files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file) // Temporary URL for preview
      }))]
    }));
  };

  const removePhoto = (index) => {
    setIssueForm(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const issueData = {
        ...issueForm,
        reportedBy: 'current-user', // Would get from auth context
        reportedAt: new Date().toISOString(),
        status: 'reported'
      };

      await apiService.post('/delivery-issues', issueData);

      // Update delivery status if needed
      if (issueForm.issueType === 'delivery_failed' || issueForm.issueType === 'customer_unavailable') {
        await apiService.put(`/deliveries/${issueForm.deliveryId}/status`, {
          status: 'failed',
          reason: issueForm.issueType,
          timestamp: new Date().toISOString()
        });
      }

      // Reset form
      setIssueForm({
        deliveryId: '',
        issueType: '',
        priority: 'medium',
        description: '',
        location: '',
        contactedCustomer: false,
        resolutionAttempts: '',
        photos: [],
        estimatedDelay: 0
      });
      setSelectedDelivery('');

      // Refresh issues list
      fetchIssues();
      fetchActiveDeliveries();

      alert('Issue reported successfully!');
    } catch (error) {
      console.error('Failed to report issue:', error);
      alert('Failed to report issue: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueStatusUpdate = async (issueId, newStatus) => {
    try {
      await apiService.put(`/delivery-issues/${issueId}/status`, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: 'current-user'
      });

      setIssues(prev => 
        prev.map(issue => 
          issue.id === issueId 
            ? { ...issue, status: newStatus }
            : issue
        )
      );
    } catch (error) {
      console.error('Failed to update issue status:', error);
      alert('Failed to update issue status');
    }
  };

  const getIssueTypeIcon = (type) => {
    switch (type) {
      case 'customer_unavailable':
        return 'person-x';
      case 'wrong_address':
        return 'geo-alt-fill';
      case 'damaged_package':
        return 'box';
      case 'delivery_failed':
        return 'x-circle';
      case 'vehicle_issue':
        return 'truck';
      case 'traffic_delay':
        return 'clock';
      case 'weather':
        return 'cloud-rain';
      case 'other':
        return 'exclamation-triangle';
      default:
        return 'exclamation-circle';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getSelectedDeliveryDetails = () => {
    return activeDeliveries.find(delivery => delivery.id === selectedDelivery);
  };

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Issue Reporting Form */}
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Report Delivery Issue
              </h5>
            </div>

            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Delivery Selection */}
                <div className="mb-4">
                  <label className="form-label">
                    Select Delivery <span className="text-danger">*</span>
                  </label>
                  <div className="row">
                    {activeDeliveries.map(delivery => (
                      <div key={delivery.id} className="col-md-6 mb-3">
                        <div 
                          className={`card cursor-pointer ${selectedDelivery === delivery.id ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                          onClick={() => handleDeliverySelect(delivery.id)}
                        >
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="mb-0">#{delivery.orderNumber}</h6>
                              <StatusBadge status={delivery.status} />
                            </div>
                            <p className="mb-1 small">{delivery.customer?.name}</p>
                            <p className="mb-0 small text-muted">
                              {delivery.address?.street}, {delivery.address?.city}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Delivery Details */}
                {selectedDelivery && (
                  <div className="alert alert-info mb-4">
                    <h6>Selected Delivery Details:</h6>
                    <div className="row">
                      <div className="col-md-6">
                        <strong>Order:</strong> #{getSelectedDeliveryDetails()?.orderNumber}<br />
                        <strong>Customer:</strong> {getSelectedDeliveryDetails()?.customer?.name}<br />
                        <strong>Phone:</strong> {getSelectedDeliveryDetails()?.customer?.phone}
                      </div>
                      <div className="col-md-6">
                        <strong>Address:</strong><br />
                        {getSelectedDeliveryDetails()?.address?.street}<br />
                        {getSelectedDeliveryDetails()?.address?.city}, {getSelectedDeliveryDetails()?.address?.zipCode}
                      </div>
                    </div>
                  </div>
                )}

                {/* Issue Type */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="issueType" className="form-label">
                      Issue Type <span className="text-danger">*</span>
                    </label>
                    <select
                      id="issueType"
                      name="issueType"
                      className="form-select"
                      value={issueForm.issueType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select issue type</option>
                      <option value="customer_unavailable">Customer Unavailable</option>
                      <option value="wrong_address">Wrong Address</option>
                      <option value="damaged_package">Damaged Package</option>
                      <option value="delivery_failed">Delivery Failed</option>
                      <option value="vehicle_issue">Vehicle Issue</option>
                      <option value="traffic_delay">Traffic Delay</option>
                      <option value="weather">Weather Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="priority" className="form-label">Priority</label>
                    <select
                      id="priority"
                      name="priority"
                      className="form-select"
                      value={issueForm.priority}
                      onChange={handleInputChange}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">
                    Description <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    className="form-control"
                    rows="4"
                    value={issueForm.description}
                    onChange={handleInputChange}
                    placeholder="Provide detailed description of the issue..."
                    required
                  />
                </div>

                {/* Location and Delay */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="location" className="form-label">Current Location</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      className="form-control"
                      value={issueForm.location}
                      onChange={handleInputChange}
                      placeholder="Enter your current location"
                    />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="estimatedDelay" className="form-label">Estimated Delay (minutes)</label>
                    <input
                      type="number"
                      id="estimatedDelay"
                      name="estimatedDelay"
                      className="form-control"
                      value={issueForm.estimatedDelay}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>

                {/* Customer Contact */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="contactedCustomer"
                        name="contactedCustomer"
                        checked={issueForm.contactedCustomer}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label" htmlFor="contactedCustomer">
                        Customer has been contacted
                      </label>
                    </div>
                  </div>
                </div>

                {/* Resolution Attempts */}
                <div className="mb-3">
                  <label htmlFor="resolutionAttempts" className="form-label">Resolution Attempts</label>
                  <textarea
                    id="resolutionAttempts"
                    name="resolutionAttempts"
                    className="form-control"
                    rows="3"
                    value={issueForm.resolutionAttempts}
                    onChange={handleInputChange}
                    placeholder="Describe any attempts made to resolve the issue..."
                  />
                </div>

                {/* Photo Upload */}
                <div className="mb-3">
                  <label htmlFor="photos" className="form-label">Photos (Optional)</label>
                  <input
                    type="file"
                    id="photos"
                    name="photos"
                    className="form-control"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                  <small className="text-muted">Upload photos to help document the issue</small>
                  
                  {/* Photo Preview */}
                  {issueForm.photos.length > 0 && (
                    <div className="mt-3">
                      <div className="row">
                        {issueForm.photos.map((photo, index) => (
                          <div key={index} className="col-md-3 mb-2">
                            <div className="position-relative">
                              <img 
                                src={photo.url} 
                                alt={photo.name} 
                                className="img-thumbnail w-100"
                                style={{ height: '100px', objectFit: 'cover' }}
                              />
                              <button
                                type="button"
                                className="btn btn-danger btn-sm position-absolute top-0 end-0"
                                onClick={() => removePhoto(index)}
                              >
                                <i className="bi bi-x"></i>
                              </button>
                            </div>
                            <small className="text-muted">{photo.name}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={submitting || !selectedDelivery}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Reporting Issue...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Report Issue
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Recent Issues */}
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="bi bi-list-ul me-2"></i>
                Recent Issues
              </h6>
            </div>

            <div className="card-body">
              {loading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : issues.length === 0 ? (
                <p className="text-muted text-center">No issues reported recently</p>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {issues.map(issue => (
                    <div key={issue.id} className="border-bottom pb-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-1">
                            <i className={`bi bi-${getIssueTypeIcon(issue.issueType)} me-2`}></i>
                            <strong className="small">{issue.issueType.replace('_', ' ').toUpperCase()}</strong>
                          </div>
                          <p className="small text-muted mb-1">#{issue.orderNumber}</p>
                        </div>
                        <div className="text-end">
                          <span className={`badge bg-${getPriorityColor(issue.priority)} mb-1`}>
                            {issue.priority}
                          </span>
                          <br />
                          <StatusBadge status={issue.status} />
                        </div>
                      </div>
                      
                      <p className="small mb-2">{issue.description}</p>
                      <div className="small text-muted">
                        {formatDate(issue.reportedAt)}
                      </div>

                      {issue.status === 'reported' && (
                        <div className="mt-2">
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-info"
                              onClick={() => handleIssueStatusUpdate(issue.id, 'in_progress')}
                            >
                              In Progress
                            </button>
                            <button
                              className="btn btn-outline-success"
                              onClick={() => handleIssueStatusUpdate(issue.id, 'resolved')}
                            >
                              Resolved
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">Issue Statistics</h6>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-6">
                  <div className="h4 text-danger">{issues.filter(i => i.status === 'reported').length}</div>
                  <div className="small text-muted">Reported</div>
                </div>
                <div className="col-6">
                  <div className="h4 text-success">{issues.filter(i => i.status === 'resolved').length}</div>
                  <div className="small text-muted">Resolved</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueReporting;
