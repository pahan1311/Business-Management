import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from '../../../utils/toast';
import LoadingBlock from '../../../components/common/LoadingBlock';

const IssueReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const deliveryId = location.state?.deliveryId || '';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    deliveryId,
    issueType: 'recipient-not-available',
    description: '',
    contactAttempts: 1,
    photoEvidence: null
  });
  
  const issueTypes = [
    { value: 'recipient-not-available', label: 'Recipient Not Available' },
    { value: 'wrong-address', label: 'Wrong or Incomplete Address' },
    { value: 'refused-delivery', label: 'Customer Refused Delivery' },
    { value: 'damaged-in-transit', label: 'Package Damaged in Transit' },
    { value: 'security-issue', label: 'Security Issue at Delivery Location' },
    { value: 'weather-conditions', label: 'Adverse Weather Conditions' },
    { value: 'vehicle-issue', label: 'Vehicle Breakdown or Issue' },
    { value: 'other', label: 'Other Issue' }
  ];
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, photoEvidence: file }));
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate required fields
    if (!formData.deliveryId || !formData.issueType || !formData.description) {
      toast.error('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      console.log('Submitting issue report:', formData);
      toast.success('Issue reported successfully!');
      setLoading(false);
      navigate('/delivery/dashboard');
    }, 1500);
  };
  
  if (loading) return <LoadingBlock text="Submitting report..." />;
  
  return (
    <div className="issue-report-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Report Delivery Issue</h1>
        <button 
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>
      
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="deliveryId" className="form-label">Delivery ID *</label>
              <input
                type="text"
                className="form-control"
                id="deliveryId"
                name="deliveryId"
                value={formData.deliveryId}
                onChange={handleInputChange}
                readOnly={!!deliveryId}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="issueType" className="form-label">Issue Type *</label>
              <select
                className="form-select"
                id="issueType"
                name="issueType"
                value={formData.issueType}
                onChange={handleInputChange}
                required
              >
                {issueTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description *</label>
              <textarea
                className="form-control"
                id="description"
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Please provide detailed information about the issue..."
                required
              ></textarea>
            </div>
            
            {(formData.issueType === 'recipient-not-available') && (
              <div className="mb-3">
                <label htmlFor="contactAttempts" className="form-label">Contact Attempts</label>
                <select
                  className="form-select"
                  id="contactAttempts"
                  name="contactAttempts"
                  value={formData.contactAttempts}
                  onChange={handleInputChange}
                >
                  <option value="1">1st Attempt</option>
                  <option value="2">2nd Attempt</option>
                  <option value="3">3rd Attempt (Final)</option>
                </select>
              </div>
            )}
            
            <div className="mb-4">
              <label htmlFor="photoEvidence" className="form-label">Upload Evidence (optional)</label>
              <input
                type="file"
                className="form-control"
                id="photoEvidence"
                accept="image/*"
                onChange={handleFileChange}
              />
              <div className="form-text">
                Upload a photo of the issue (e.g., damaged package, incorrect address, etc.)
              </div>
            </div>
            
            <div className="d-flex justify-content-between">
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                <i className="bi bi-exclamation-triangle me-1"></i>
                Submit Report
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default IssueReport;
