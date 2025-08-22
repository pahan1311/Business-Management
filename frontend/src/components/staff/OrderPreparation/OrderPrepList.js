import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import StatusBadge from '../../common/StatusBadge';
import { formatDate } from '../../../utils/helpers';

const OrderPrepList = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignedTo: 'all',
    dueDate: ''
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchStaff();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/orders/preparation-queue');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await apiService.get('/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.preparationStatus === filters.status);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(order => order.priority === filters.priority);
    }

    if (filters.assignedTo !== 'all') {
      filtered = filtered.filter(order => order.assignedTo === filters.assignedTo);
    }

    if (filters.dueDate) {
      const targetDate = new Date(filters.dueDate).toDateString();
      filtered = filtered.filter(order => 
        new Date(order.requiredBy).toDateString() === targetDate
      );
    }

    setFilteredOrders(filtered);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await apiService.put(`/orders/${orderId}/preparation-status`, {
        status: newStatus,
        timestamp: new Date().toISOString()
      });

      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, preparationStatus: newStatus }
            : order
        )
      );
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    }
  };

  const handleAssignOrder = async (orderId, staffId) => {
    try {
      await apiService.put(`/orders/${orderId}/assign`, {
        assignedTo: staffId,
        timestamp: new Date().toISOString()
      });

      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, assignedTo: staffId }
            : order
        )
      );
    } catch (error) {
      console.error('Failed to assign order:', error);
      alert('Failed to assign order');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'preparing':
        return 'info';
      case 'ready':
        return 'success';
      case 'delayed':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const isOrderOverdue = (order) => {
    return new Date(order.requiredBy) < new Date() && order.preparationStatus !== 'ready';
  };

  const getOrderStats = () => {
    const total = orders.length;
    const pending = orders.filter(o => o.preparationStatus === 'pending').length;
    const preparing = orders.filter(o => o.preparationStatus === 'preparing').length;
    const ready = orders.filter(o => o.preparationStatus === 'ready').length;
    const overdue = orders.filter(o => isOrderOverdue(o)).length;

    return { total, pending, preparing, ready, overdue };
  };

  const stats = getOrderStats();

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Order Preparation Queue</h4>
            <button
              className="btn btn-outline-primary"
              onClick={fetchOrders}
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
                  <small className="text-muted">Total Orders</small>
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
                  <h3 className="text-info">{stats.preparing}</h3>
                  <small className="text-muted">Preparing</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center border-success">
                <div className="card-body">
                  <h3 className="text-success">{stats.ready}</h3>
                  <small className="text-muted">Ready</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center border-danger">
                <div className="card-body">
                  <h3 className="text-danger">{stats.overdue}</h3>
                  <small className="text-muted">Overdue</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center">
                <div className="card-body">
                  <div className="progress" style={{ height: '30px' }}>
                    <div 
                      className="progress-bar bg-success" 
                      style={{ width: `${stats.total > 0 ? (stats.ready / stats.total) * 100 : 0}%` }}
                    >
                      {stats.total > 0 ? Math.round((stats.ready / stats.total) * 100) : 0}%
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
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="delayed">Delayed</option>
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
              <label htmlFor="assignedFilter" className="form-label">Assigned To</label>
              <select
                id="assignedFilter"
                className="form-select form-select-sm"
                value={filters.assignedTo}
                onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
              >
                <option value="all">All Staff</option>
                <option value="">Unassigned</option>
                {staff.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="dueDateFilter" className="form-label">Due Date</label>
              <input
                type="date"
                id="dueDateFilter"
                className="form-control form-control-sm"
                value={filters.dueDate}
                onChange={(e) => setFilters(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="row">
        <div className="col-12">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bi bi-inbox display-1 text-muted"></i>
                <h5 className="mt-3">No orders found</h5>
                <p className="text-muted">No orders match the selected filters.</p>
              </div>
            </div>
          ) : (
            <div className="row">
              {filteredOrders.map(order => (
                <div key={order.id} className="col-lg-6 col-xl-4 mb-4">
                  <div className={`card h-100 ${isOrderOverdue(order) ? 'border-danger' : ''}`}>
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">#{order.orderNumber}</h6>
                        <small className="text-muted">{order.customer?.name}</small>
                      </div>
                      <div className="text-end">
                        <StatusBadge 
                          status={order.preparationStatus} 
                          className="mb-1"
                        />
                        <br />
                        <span className={`badge bg-${getPriorityColor(order.priority)} badge-sm`}>
                          {order.priority?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted small">Required by:</span>
                          <span className={`small ${isOrderOverdue(order) ? 'text-danger fw-bold' : ''}`}>
                            {formatDate(order.requiredBy)}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted small">Items:</span>
                          <span className="small">{order.items?.length || 0} items</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted small">Total:</span>
                          <span className="small fw-bold">${order.total?.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Assignment */}
                      <div className="mb-3">
                        <label className="form-label small">Assigned To:</label>
                        <select
                          className="form-select form-select-sm"
                          value={order.assignedTo || ''}
                          onChange={(e) => handleAssignOrder(order.id, e.target.value)}
                        >
                          <option value="">Select staff member</option>
                          {staff.map(member => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Order Items Preview */}
                      <div className="mb-3">
                        <div className="small text-muted mb-1">Items:</div>
                        <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                          {order.items?.slice(0, 3).map((item, index) => (
                            <div key={index} className="d-flex justify-content-between align-items-center border-bottom py-1">
                              <span className="small">{item.name}</span>
                              <span className="small text-muted">×{item.quantity}</span>
                            </div>
                          ))}
                          {order.items?.length > 3 && (
                            <div className="text-center small text-muted py-1">
                              +{order.items.length - 3} more items
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Special Instructions */}
                      {order.specialInstructions && (
                        <div className="mb-3">
                          <div className="small text-muted mb-1">Special Instructions:</div>
                          <div className="small bg-light p-2 rounded">
                            {order.specialInstructions}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="card-footer">
                      <div className="d-flex justify-content-between align-items-center">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <i className="bi bi-eye me-1"></i>
                          View Details
                        </button>

                        {/* Status Action Buttons */}
                        <div className="btn-group">
                          {order.preparationStatus === 'pending' && (
                            <button
                              className="btn btn-info btn-sm"
                              onClick={() => handleStatusUpdate(order.id, 'preparing')}
                            >
                              <i className="bi bi-play-fill me-1"></i>
                              Start
                            </button>
                          )}
                          {order.preparationStatus === 'preparing' && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleStatusUpdate(order.id, 'ready')}
                            >
                              <i className="bi bi-check-lg me-1"></i>
                              Complete
                            </button>
                          )}
                          {order.preparationStatus !== 'delayed' && isOrderOverdue(order) && (
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => handleStatusUpdate(order.id, 'delayed')}
                            >
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              Mark Delayed
                            </button>
                          )}
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Order #{selectedOrder.orderNumber}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedOrder(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Customer:</strong> {selectedOrder.customer?.name}<br />
                    <strong>Phone:</strong> {selectedOrder.customer?.phone}<br />
                    <strong>Email:</strong> {selectedOrder.customer?.email}
                  </div>
                  <div className="col-md-6">
                    <strong>Order Date:</strong> {formatDate(selectedOrder.orderDate)}<br />
                    <strong>Required By:</strong> {formatDate(selectedOrder.requiredBy)}<br />
                    <strong>Priority:</strong> 
                    <span className={`badge bg-${getPriorityColor(selectedOrder.priority)} ms-2`}>
                      {selectedOrder.priority?.toUpperCase()}
                    </span>
                  </div>
                </div>

                <h6>Order Items</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, index) => (
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
                        <td><strong>${selectedOrder.total?.toFixed(2)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {selectedOrder.specialInstructions && (
                  <>
                    <h6>Special Instructions</h6>
                    <div className="bg-light p-3 rounded">
                      {selectedOrder.specialInstructions}
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPrepList;
