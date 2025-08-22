import React, { useState, useEffect } from 'react';
import { inquiryAPI } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import StatusBadge from '../../common/StatusBadge';
import LoadingSpinner from '../../common/LoadingSpinner';
import { formatDate, getStatusBadgeColor } from '../../../utils/helpers';

const InquiryHistory = () => {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchInquiries();
    }
  }, [user]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await inquiryAPI.getByCustomer(user.id);
      setInquiries(response.data);
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInquiries = inquiries.filter(inquiry =>
    !statusFilter || inquiry.status === statusFilter
  );

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
      default:
        return 'secondary';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'order':
        return 'cart';
      case 'delivery':
        return 'truck';
      case 'payment':
        return 'credit-card';
      case 'complaint':
        return 'exclamation-triangle';
      case 'feedback':
        return 'chat-heart';
      default:
        return 'chat-dots';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your inquiries..." />;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>My Inquiries</h2>
          <p className="text-muted mb-0">Track your submitted inquiries and responses</p>
        </div>
        <button 
          className="btn btn-outline-primary"
          onClick={fetchInquiries}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="row mb-4">
        <div className="col-md-4">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="col-md-8 text-end">
          <span className="text-muted">
            Showing {filteredInquiries.length} of {inquiries.length} inquiries
          </span>
        </div>
      </div>

      {/* Inquiries List */}
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              {filteredInquiries.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-chat-dots fs-1 text-muted d-block mb-2"></i>
                  <p className="text-muted">No inquiries found</p>
                  <a href="/customer/inquiries/new" className="btn btn-primary">
                    Submit Your First Inquiry
                  </a>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {filteredInquiries.map(inquiry => (
                    <div 
                      key={inquiry.id} 
                      className={`list-group-item list-group-item-action ${selectedInquiry?.id === inquiry.id ? 'active' : ''}`}
                      onClick={() => setSelectedInquiry(inquiry)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex w-100 justify-content-between">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-2">
                            <i className={`bi bi-${getCategoryIcon(inquiry.category)} me-2`}></i>
                            <h6 className="mb-0">{inquiry.subject}</h6>
                            <span className={`badge bg-${getPriorityColor(inquiry.priority)} ms-2`}>
                              {inquiry.priority.toUpperCase()}
                            </span>
                          </div>
                          <p className="mb-1 text-muted">
                            {inquiry.message.length > 100 
                              ? `${inquiry.message.substring(0, 100)}...` 
                              : inquiry.message
                            }
                          </p>
                          <small className="text-muted">
                            {formatDate(inquiry.createdAt)}
                          </small>
                        </div>
                        <div className="text-end">
                          <StatusBadge status={inquiry.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inquiry Details */}
        <div className="col-md-4">
          {selectedInquiry ? (
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Inquiry Details</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <h6>{selectedInquiry.subject}</h6>
                  <div className="d-flex gap-2 mb-2">
                    <StatusBadge status={selectedInquiry.status} />
                    <span className={`badge bg-${getPriorityColor(selectedInquiry.priority)}`}>
                      {selectedInquiry.priority.toUpperCase()}
                    </span>
                  </div>
                  <small className="text-muted">
                    <i className="bi bi-calendar me-1"></i>
                    {formatDate(selectedInquiry.createdAt)}
                  </small>
                </div>

                <div className="mb-3">
                  <h6>Category</h6>
                  <span className="badge bg-secondary">
                    <i className={`bi bi-${getCategoryIcon(selectedInquiry.category)} me-1`}></i>
                    {selectedInquiry.category.charAt(0).toUpperCase() + selectedInquiry.category.slice(1)}
                  </span>
                </div>

                <div className="mb-3">
                  <h6>Message</h6>
                  <p className="text-muted">{selectedInquiry.message}</p>
                </div>

                {selectedInquiry.response && (
                  <div className="mb-3">
                    <h6>Response</h6>
                    <div className="alert alert-info">
                      <p className="mb-1">{selectedInquiry.response}</p>
                      {selectedInquiry.respondedAt && (
                        <small className="text-muted">
                          Responded on {formatDate(selectedInquiry.respondedAt)}
                        </small>
                      )}
                    </div>
                  </div>
                )}

                {selectedInquiry.status !== 'closed' && (
                  <div className="text-center">
                    <small className="text-muted">
                      This inquiry is being processed.
                      You'll be notified when there's an update.
                    </small>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body text-center">
                <i className="bi bi-arrow-left fs-2 text-muted mb-3 d-block"></i>
                <p className="text-muted">
                  Select an inquiry from the list to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Inquiry Statistics</h6>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-3">
                  <h4 className="text-warning">{inquiries.filter(i => i.status === 'open').length}</h4>
                  <small className="text-muted">Open</small>
                </div>
                <div className="col-md-3">
                  <h4 className="text-info">{inquiries.filter(i => i.status === 'in_progress').length}</h4>
                  <small className="text-muted">In Progress</small>
                </div>
                <div className="col-md-3">
                  <h4 className="text-success">{inquiries.filter(i => i.status === 'resolved').length}</h4>
                  <small className="text-muted">Resolved</small>
                </div>
                <div className="col-md-3">
                  <h4 className="text-secondary">{inquiries.filter(i => i.status === 'closed').length}</h4>
                  <small className="text-muted">Closed</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryHistory;
