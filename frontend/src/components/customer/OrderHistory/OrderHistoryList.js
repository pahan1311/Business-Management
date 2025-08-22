import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import StatusBadge from '../../common/StatusBadge';
import LoadingSpinner from '../../common/LoadingSpinner';
import { formatDate, formatCurrency } from '../../../utils/helpers';

const OrderHistoryList = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getByCustomer(user.id);
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order =>
    !statusFilter || order.status === statusFilter
  );

  const getOrderStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'clock';
      case 'confirmed':
        return 'check-circle';
      case 'processing':
        return 'gear';
      case 'ready':
        return 'box-seam';
      case 'out_for_delivery':
        return 'truck';
      case 'delivered':
        return 'check-circle-fill';
      case 'cancelled':
        return 'x-circle';
      default:
        return 'circle';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your orders..." />;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>My Order History</h2>
          <p className="text-muted mb-0">View and track all your orders</p>
        </div>
        <button 
          className="btn btn-outline-primary"
          onClick={fetchOrders}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </button>
      </div>

      {/* Filter and Stats */}
      <div className="row mb-4">
        <div className="col-md-4">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="ready">Ready</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="col-md-8">
          <div className="row text-center">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body py-2">
                  <h5 className="mb-0">{orders.length}</h5>
                  <small>Total Orders</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body py-2">
                  <h5 className="mb-0">{orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length}</h5>
                  <small>Active</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body py-2">
                  <h5 className="mb-0">{orders.filter(o => o.status === 'delivered').length}</h5>
                  <small>Delivered</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body py-2">
                  <h5 className="mb-0">{formatCurrency(orders.reduce((sum, o) => sum + o.total, 0))}</h5>
                  <small>Total Spent</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-cart-x fs-1 text-muted d-block mb-2"></i>
                  <p className="text-muted">No orders found</p>
                  <a href="/customer/shop" className="btn btn-primary">
                    Start Shopping
                  </a>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {filteredOrders.map(order => (
                    <div 
                      key={order.id} 
                      className={`list-group-item list-group-item-action ${selectedOrder?.id === order.id ? 'active' : ''}`}
                      onClick={() => setSelectedOrder(order)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex w-100 justify-content-between align-items-center">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-2">
                            <i className={`bi bi-${getOrderStatusIcon(order.status)} me-2`}></i>
                            <h6 className="mb-0">Order #{order.id}</h6>
                            <span className="badge bg-secondary ms-2">
                              {order.items?.length || 0} items
                            </span>
                          </div>
                          <p className="mb-1">
                            <strong>{formatCurrency(order.total)}</strong>
                          </p>
                          <small className="text-muted">
                            Ordered on {formatDate(order.createdAt)}
                          </small>
                        </div>
                        <div className="text-end">
                          <StatusBadge status={order.status} />
                          <div className="mt-2">
                            <small className="text-muted">
                              {order.deliveryDate && `Expected: ${formatDate(order.deliveryDate)}`}
                            </small>
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

        {/* Order Details */}
        <div className="col-md-4">
          {selectedOrder ? (
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Order #{selectedOrder.id}</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Status:</span>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Date:</span>
                    <small>{formatDate(selectedOrder.createdAt)}</small>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total:</span>
                    <strong>{formatCurrency(selectedOrder.total)}</strong>
                  </div>
                  {selectedOrder.deliveryDate && (
                    <div className="d-flex justify-content-between mb-2">
                      <span>Expected:</span>
                      <small>{formatDate(selectedOrder.deliveryDate)}</small>
                    </div>
                  )}
                </div>

                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="mb-3">
                    <h6>Items Ordered</h6>
                    <div className="list-group list-group-flush">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="list-group-item px-0">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">{item.name}</h6>
                              <small className="text-muted">
                                Qty: {item.quantity} × {formatCurrency(item.price)}
                              </small>
                            </div>
                            <strong>{formatCurrency(item.quantity * item.price)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedOrder.deliveryAddress && (
                  <div className="mb-3">
                    <h6>Delivery Address</h6>
                    <p className="text-muted small">
                      {typeof selectedOrder.deliveryAddress === 'object' 
                        ? `${selectedOrder.deliveryAddress.street || ''}, 
                           ${selectedOrder.deliveryAddress.city || ''}, 
                           ${selectedOrder.deliveryAddress.state || ''} 
                           ${selectedOrder.deliveryAddress.zip || ''}, 
                           ${selectedOrder.deliveryAddress.country || ''}`
                        : selectedOrder.deliveryAddress}
                    </p>
                  </div>
                )}

                <div className="d-grid gap-2">
                  {selectedOrder.status === 'delivered' && (
                    <button className="btn btn-outline-primary btn-sm">
                      <i className="bi bi-arrow-repeat me-2"></i>
                      Reorder
                    </button>
                  )}
                  {['pending', 'confirmed'].includes(selectedOrder.status) && (
                    <button className="btn btn-outline-warning btn-sm">
                      <i className="bi bi-x-circle me-2"></i>
                      Cancel Order
                    </button>
                  )}
                  <button className="btn btn-outline-secondary btn-sm">
                    <i className="bi bi-download me-2"></i>
                    Download Invoice
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body text-center">
                <i className="bi bi-arrow-left fs-2 text-muted mb-3 d-block"></i>
                <p className="text-muted">
                  Select an order from the list to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryList;
