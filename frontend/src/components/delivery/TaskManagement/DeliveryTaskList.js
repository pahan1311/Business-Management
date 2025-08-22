import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import StatusBadge from '../../common/StatusBadge';
import { formatDate } from '../../../utils/helpers';

const DeliveryTaskList = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    route: 'all',
    date: ''
  });
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    fetchDeliveries();
    fetchRoutes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [deliveries, filters]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/deliveries/tasks');
      setDeliveries(response.data);
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await apiService.get('/deliveries/routes');
      setRoutes(response.data);
    } catch (error) {
      console.error('Failed to fetch routes:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...deliveries];

    if (filters.status !== 'all') {
      filtered = filtered.filter(delivery => delivery.status === filters.status);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(delivery => delivery.priority === filters.priority);
    }

    if (filters.route !== 'all') {
      filtered = filtered.filter(delivery => delivery.routeId === filters.route);
    }

    if (filters.date) {
      const targetDate = new Date(filters.date).toDateString();
      filtered = filtered.filter(delivery => 
        new Date(delivery.scheduledDate).toDateString() === targetDate
      );
    }

    setFilteredDeliveries(filtered);
  };

  const handleStatusUpdate = async (deliveryId, newStatus) => {
    try {
      await apiService.put(`/deliveries/${deliveryId}/status`, {
        status: newStatus,
        timestamp: new Date().toISOString()
      });

      setDeliveries(prev => 
        prev.map(delivery => 
          delivery.id === deliveryId 
            ? { ...delivery, status: newStatus }
            : delivery
        )
      );
    } catch (error) {
      console.error('Failed to update delivery status:', error);
      alert('Failed to update delivery status');
    }
  };

  const getDeliveryStats = () => {
    const total = deliveries.length;
    const pending = deliveries.filter(d => d.status === 'pending').length;
    const inTransit = deliveries.filter(d => d.status === 'in_transit').length;
    const delivered = deliveries.filter(d => d.status === 'delivered').length;
    const failed = deliveries.filter(d => d.status === 'failed').length;

    return { total, pending, inTransit, delivered, failed };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'assigned':
        return 'info';
      case 'picked_up':
        return 'primary';
      case 'in_transit':
        return 'info';
      case 'delivered':
        return 'success';
      case 'failed':
        return 'danger';
      default:
        return 'secondary';
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

  const isDeliveryOverdue = (delivery) => {
    return new Date(delivery.scheduledDate) < new Date() && delivery.status !== 'delivered';
  };

  const stats = getDeliveryStats();

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Delivery Tasks</h4>
            <button
              className="btn btn-outline-primary"
              onClick={fetchDeliveries}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="row">
            <div className="col-md-2">
              <div className="card text-center border-primary">
                <div className="card-body">
                  <h3 className="text-primary">{stats.total}</h3>
                  <small className="text-muted">Total Deliveries</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center border-warning">
                <div className="card-body">
                  <h3 className="text-warning">{stats.pending}</h3>
                  <small className="text-muted">Pending</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center border-info">
                <div className="card-body">
                  <h3 className="text-info">{stats.inTransit}</h3>
                  <small className="text-muted">In Transit</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center border-success">
                <div className="card-body">
                  <h3 className="text-success">{stats.delivered}</h3>
                  <small className="text-muted">Delivered</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center border-danger">
                <div className="card-body">
                  <h3 className="text-danger">{stats.failed}</h3>
                  <small className="text-muted">Failed</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center">
                <div className="card-body">
                  <div className="progress" style={{ height: '30px' }}>
                    <div 
                      className="progress-bar bg-success" 
                      style={{ width: `${stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0}%` }}
                    >
                      {stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0}%
                    </div>
                  </div>
                  <small className="text-muted">Completion</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <label htmlFor="statusFilter" className="form-label">Status</label>
              <select
                id="statusFilter"
                className="form-select form-select-sm"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="priorityFilter" className="form-label">Priority</label>
              <select
                id="priorityFilter"
                className="form-select form-select-sm"
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="routeFilter" className="form-label">Route</label>
              <select
                id="routeFilter"
                className="form-select form-select-sm"
                value={filters.route}
                onChange={(e) => setFilters(prev => ({ ...prev, route: e.target.value }))}
              >
                <option value="all">All Routes</option>
                {routes.map(route => (
                  <option key={route.id} value={route.id}>
                    {route.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="dateFilter" className="form-label">Date</label>
              <input
                type="date"
                id="dateFilter"
                className="form-control form-control-sm"
                value={filters.date}
                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="row">
        <div className="col-12">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bi bi-truck display-1 text-muted"></i>
                <h5 className="mt-3">No deliveries found</h5>
                <p className="text-muted">No deliveries match the selected filters.</p>
              </div>
            </div>
          ) : (
            <div className="row">
              {filteredDeliveries.map(delivery => (
                <div key={delivery.id} className="col-lg-6 col-xl-4 mb-4">
                  <div className={`card h-100 ${isDeliveryOverdue(delivery) ? 'border-danger' : ''}`}>
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">#{delivery.orderNumber}</h6>
                        <small className="text-muted">{delivery.customer?.name}</small>
                      </div>
                      <div className="text-end">
                        <StatusBadge 
                          status={delivery.status} 
                          className="mb-1"
                        />
                        <br />
                        <span className={`badge bg-${getPriorityColor(delivery.priority)} badge-sm`}>
                          {delivery.priority?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted small">Scheduled:</span>
                          <span className={`small ${isDeliveryOverdue(delivery) ? 'text-danger fw-bold' : ''}`}>
                            {formatDate(delivery.scheduledDate)}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted small">Route:</span>
                          <span className="small">{delivery.route?.name || 'Unassigned'}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted small">Distance:</span>
                          <span className="small">{delivery.distance || 'N/A'} km</span>
                        </div>
                      </div>

                      {/* Customer Address */}
                      <div className="mb-3">
                        <div className="small text-muted mb-1">Delivery Address:</div>
                        <div className="small bg-light p-2 rounded">
                          {delivery.address?.street}<br />
                          {delivery.address?.city}, {delivery.address?.zipCode}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted small">Items:</span>
                          <span className="small">{delivery.itemCount} items</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted small">Total:</span>
                          <span className="small fw-bold">${delivery.total?.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Special Instructions */}
                      {delivery.deliveryInstructions && (
                        <div className="mb-3">
                          <div className="small text-muted mb-1">Instructions:</div>
                          <div className="small bg-warning bg-opacity-10 p-2 rounded">
                            <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                            {delivery.deliveryInstructions}
                          </div>
                        </div>
                      )}

                      {/* Contact Info */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted small">Phone:</span>
                          <a href={`tel:${delivery.customer?.phone}`} className="small text-decoration-none">
                            {delivery.customer?.phone}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="card-footer">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="btn-group-vertical w-100">
                          {/* Status Action Buttons */}
                          {delivery.status === 'pending' && (
                            <button
                              className="btn btn-info btn-sm mb-1"
                              onClick={() => handleStatusUpdate(delivery.id, 'picked_up')}
                            >
                              <i className="bi bi-box me-1"></i>
                              Pick Up
                            </button>
                          )}
                          {delivery.status === 'picked_up' && (
                            <button
                              className="btn btn-primary btn-sm mb-1"
                              onClick={() => handleStatusUpdate(delivery.id, 'in_transit')}
                            >
                              <i className="bi bi-truck me-1"></i>
                              Start Delivery
                            </button>
                          )}
                          {delivery.status === 'in_transit' && (
                            <div className="btn-group w-100 mb-1">
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleStatusUpdate(delivery.id, 'delivered')}
                              >
                                <i className="bi bi-check-lg me-1"></i>
                                Delivered
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleStatusUpdate(delivery.id, 'failed')}
                              >
                                <i className="bi bi-x-lg me-1"></i>
                                Failed
                              </button>
                            </div>
                          )}
                          
                          {/* Navigation Button */}
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(
                              `${delivery.address?.street}, ${delivery.address?.city}, ${delivery.address?.zipCode}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-primary btn-sm"
                          >
                            <i className="bi bi-geo-alt me-1"></i>
                            Navigate
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryTaskList;
