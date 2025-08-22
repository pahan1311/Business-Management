import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import StatusBadge from '../../common/StatusBadge';
import { formatDate } from '../../../utils/helpers';

const DeliveryTracking = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    driver: 'all',
    route: 'all',
    date: ''
  });
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  useEffect(() => {
    fetchDeliveries();
    fetchDrivers();
    fetchRoutes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [deliveries, filters]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/admin/deliveries');
      setDeliveries(response.data);
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await apiService.get('/drivers');
      setDrivers(response.data);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await apiService.get('/delivery-routes');
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

    if (filters.driver !== 'all') {
      filtered = filtered.filter(delivery => delivery.driverId === filters.driver);
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
        timestamp: new Date().toISOString(),
        updatedBy: 'admin'
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

  const handleAssignDriver = async (deliveryId, driverId) => {
    try {
      await apiService.put(`/deliveries/${deliveryId}/assign-driver`, {
        driverId,
        assignedAt: new Date().toISOString(),
        assignedBy: 'admin'
      });

      setDeliveries(prev => 
        prev.map(delivery => 
          delivery.id === deliveryId 
            ? { 
                ...delivery, 
                driverId, 
                driver: drivers.find(d => d.id === driverId),
                status: 'assigned' 
              }
            : delivery
        )
      );
    } catch (error) {
      console.error('Failed to assign driver:', error);
      alert('Failed to assign driver');
    }
  };

  const getDeliveryStats = () => {
    const total = deliveries.length;
    const pending = deliveries.filter(d => d.status === 'pending').length;
    const assigned = deliveries.filter(d => d.status === 'assigned').length;
    const inTransit = deliveries.filter(d => d.status === 'in_transit').length;
    const delivered = deliveries.filter(d => d.status === 'delivered').length;
    const failed = deliveries.filter(d => d.status === 'failed').length;

    return { total, pending, assigned, inTransit, delivered, failed };
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

  const isDeliveryOverdue = (delivery) => {
    return new Date(delivery.scheduledDate) < new Date() && 
           !['delivered', 'failed'].includes(delivery.status);
  };

  const stats = getDeliveryStats();

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Delivery Tracking</h4>
            <div className="btn-group">
              <button
                className="btn btn-outline-primary"
                onClick={fetchDeliveries}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </button>
              <button className="btn btn-primary">
                <i className="bi bi-plus-lg me-2"></i>
                Schedule Delivery
              </button>
            </div>
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
                  <h3 className="text-info">{stats.assigned}</h3>
                  <small className="text-muted">Assigned</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center border-primary">
                <div className="card-body">
                  <h3 className="text-primary">{stats.inTransit}</h3>
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
              <label htmlFor="driverFilter" className="form-label">Driver</label>
              <select
                id="driverFilter"
                className="form-select form-select-sm"
                value={filters.driver}
                onChange={(e) => setFilters(prev => ({ ...prev, driver: e.target.value }))}
              >
                <option value="all">All Drivers</option>
                <option value="">Unassigned</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
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

      {/* Deliveries Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-truck display-1 text-muted"></i>
              <h5 className="mt-3">No deliveries found</h5>
              <p className="text-muted">No deliveries match the selected filters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Address</th>
                    <th>Driver</th>
                    <th>Route</th>
                    <th>Scheduled</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Priority</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveries.map(delivery => (
                    <tr 
                      key={delivery.id}
                      className={isDeliveryOverdue(delivery) ? 'table-warning' : ''}
                    >
                      <td>
                        <div>
                          <div className="fw-bold">#{delivery.orderNumber}</div>
                          <small className="text-muted">${delivery.total?.toFixed(2)}</small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{delivery.customer?.name}</div>
                          <small className="text-muted">{delivery.customer?.phone}</small>
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          {delivery.address?.street}<br />
                          {delivery.address?.city}, {delivery.address?.zipCode}
                        </div>
                      </td>
                      <td>
                        {delivery.driver ? (
                          <div>
                            <div>{delivery.driver.name}</div>
                            <small className="text-muted">{delivery.driver.phone}</small>
                          </div>
                        ) : (
                          <div className="dropdown">
                            <button 
                              className="btn btn-sm btn-outline-primary dropdown-toggle" 
                              type="button" 
                              data-bs-toggle="dropdown"
                            >
                              Assign Driver
                            </button>
                            <ul className="dropdown-menu">
                              {drivers.map(driver => (
                                <li key={driver.id}>
                                  <button 
                                    className="dropdown-item"
                                    onClick={() => handleAssignDriver(delivery.id, driver.id)}
                                  >
                                    {driver.name}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                      <td>
                        {delivery.route ? (
                          <span className="badge bg-secondary">{delivery.route.name}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <div className={isDeliveryOverdue(delivery) ? 'text-danger fw-bold' : ''}>
                          {formatDate(delivery.scheduledDate)}
                        </div>
                      </td>
                      <td className="text-center">
                        <StatusBadge status={delivery.status} />
                        {isDeliveryOverdue(delivery) && (
                          <div>
                            <small className="badge bg-danger">OVERDUE</small>
                          </div>
                        )}
                      </td>
                      <td className="text-center">
                        <span className={`badge bg-${
                          delivery.priority === 'urgent' ? 'danger' :
                          delivery.priority === 'high' ? 'warning' : 'info'
                        }`}>
                          {delivery.priority?.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-primary"
                            onClick={() => setSelectedDelivery(delivery)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <div className="dropdown">
                            <button 
                              className="btn btn-outline-secondary dropdown-toggle" 
                              type="button" 
                              data-bs-toggle="dropdown"
                            >
                              <i className="bi bi-gear"></i>
                            </button>
                            <ul className="dropdown-menu">
                              {delivery.status === 'pending' && (
                                <li>
                                  <button 
                                    className="dropdown-item"
                                    onClick={() => handleStatusUpdate(delivery.id, 'assigned')}
                                  >
                                    Mark as Assigned
                                  </button>
                                </li>
                              )}
                              {delivery.status === 'assigned' && (
                                <li>
                                  <button 
                                    className="dropdown-item"
                                    onClick={() => handleStatusUpdate(delivery.id, 'picked_up')}
                                  >
                                    Mark as Picked Up
                                  </button>
                                </li>
                              )}
                              {['assigned', 'picked_up'].includes(delivery.status) && (
                                <li>
                                  <button 
                                    className="dropdown-item"
                                    onClick={() => handleStatusUpdate(delivery.id, 'in_transit')}
                                  >
                                    Mark In Transit
                                  </button>
                                </li>
                              )}
                              {delivery.status === 'in_transit' && (
                                <>
                                  <li>
                                    <button 
                                      className="dropdown-item"
                                      onClick={() => handleStatusUpdate(delivery.id, 'delivered')}
                                    >
                                      Mark as Delivered
                                    </button>
                                  </li>
                                  <li>
                                    <button 
                                      className="dropdown-item text-danger"
                                      onClick={() => handleStatusUpdate(delivery.id, 'failed')}
                                    >
                                      Mark as Failed
                                    </button>
                                  </li>
                                </>
                              )}
                              <li><hr className="dropdown-divider" /></li>
                              <li>
                                <button className="dropdown-item">
                                  <i className="bi bi-geo-alt me-2"></i>
                                  View on Map
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Detail Modal */}
      {selectedDelivery && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Delivery Details - #{selectedDelivery.orderNumber}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedDelivery(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <h6>Customer Information</h6>
                    <p>
                      <strong>Name:</strong> {selectedDelivery.customer?.name}<br />
                      <strong>Phone:</strong> {selectedDelivery.customer?.phone}<br />
                      <strong>Email:</strong> {selectedDelivery.customer?.email}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6>Delivery Information</h6>
                    <p>
                      <strong>Status:</strong> <StatusBadge status={selectedDelivery.status} /><br />
                      <strong>Priority:</strong> 
                      <span className={`badge bg-${
                        selectedDelivery.priority === 'urgent' ? 'danger' :
                        selectedDelivery.priority === 'high' ? 'warning' : 'info'
                      } ms-2`}>
                        {selectedDelivery.priority?.toUpperCase()}
                      </span><br />
                      <strong>Scheduled:</strong> {formatDate(selectedDelivery.scheduledDate)}
                    </p>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <h6>Address</h6>
                    <p>
                      {selectedDelivery.address?.street}<br />
                      {selectedDelivery.address?.city}, {selectedDelivery.address?.zipCode}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6>Driver</h6>
                    {selectedDelivery.driver ? (
                      <p>
                        <strong>Name:</strong> {selectedDelivery.driver.name}<br />
                        <strong>Phone:</strong> {selectedDelivery.driver.phone}<br />
                        <strong>Vehicle:</strong> {selectedDelivery.driver.vehicle}
                      </p>
                    ) : (
                      <p className="text-muted">No driver assigned</p>
                    )}
                  </div>
                </div>

                {selectedDelivery.deliveryInstructions && (
                  <div className="mb-3">
                    <h6>Special Instructions</h6>
                    <div className="bg-warning bg-opacity-10 p-3 rounded">
                      {selectedDelivery.deliveryInstructions}
                    </div>
                  </div>
                )}

                <h6>Order Items</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDelivery.items?.map((item, index) => (
                        <tr key={index}>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>${item.unitPrice?.toFixed(2)}</td>
                          <td>${(item.quantity * item.unitPrice)?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3"><strong>Total</strong></td>
                        <td><strong>${selectedDelivery.total?.toFixed(2)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedDelivery(null)}
                >
                  Close
                </button>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    `${selectedDelivery.address?.street}, ${selectedDelivery.address?.city}, ${selectedDelivery.address?.zipCode}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <i className="bi bi-geo-alt me-2"></i>
                  View on Map
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTracking;
