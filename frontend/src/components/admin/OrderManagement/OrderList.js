import React, { useState, useEffect } from 'react';
import { orderAPI, customerAPI } from '../../../services/api';
import { useCrud } from '../../../hooks/useApi';
import Button from '../../common/Button';
import StatusBadge from '../../common/StatusBadge';
import LoadingSpinner from '../../common/LoadingSpinner';
import { formatDate, formatCurrency, getStatusBadgeColor } from '../../../utils/helpers';
import { ORDER_STATUS } from '../../../utils/constants';
import OrderDetail from './OrderDetail';

const OrderList = () => {
  const {
    items: orders,
    loading,
    fetchAll,
    update
  } = useCrud(orderAPI);

  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchAll();
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getAll();
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id?.toString().includes(searchTerm) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };
  
  const handleOrderUpdate = (updatedOrder) => {
    update(updatedOrder._id, updatedOrder);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setModalLoading(true);
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      await fetchAll(); // Refresh orders
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus
        });
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const getStatusOptions = (currentStatus) => {
    const statusFlow = {
      [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.READY]: [ORDER_STATUS.OUT_FOR_DELIVERY],
      [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED],
      [ORDER_STATUS.DELIVERED]: [],
      [ORDER_STATUS.CANCELLED]: []
    };

    return statusFlow[currentStatus] || [];
  };

  if (loading) {
    return <LoadingSpinner text="Loading orders..." />;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Order Management</h2>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary" 
            onClick={fetchAll}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-4">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            {Object.values(ORDER_STATUS).map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2 text-end">
          <span className="text-muted">
            {filteredOrders.length} orders
          </span>
        </div>
      </div>

      {/* Order Stats */}
      <div className="row g-3 mb-4">
        {Object.values(ORDER_STATUS).map(status => {
          const count = orders.filter(order => order.status === status).length;
          return (
            <div key={status} className="col-md-2">
              <div className="card text-center">
                <div className="card-body py-2">
                  <div className={`badge bg-${getStatusBadgeColor(status)} w-100 mb-1`}>
                    {status.replace('_', ' ').toUpperCase()}
                  </div>
                  <h4 className="mb-0">{count}</h4>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Table */}
      <div className="card">
        <div className="card-body">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-cart-x fs-1 text-muted d-block mb-2"></i>
              <p className="text-muted">No orders found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id}>
                      <td>
                        <strong>#{order.id}</strong>
                      </td>
                      <td>{order.customerName || order.customer?.name}</td>
                      <td>
                        <small>
                          {order.items?.length || 0} items
                        </small>
                      </td>
                      <td>
                        <strong>{formatCurrency(order.total)}</strong>
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleViewOrder(order)}
                          >
                            View
                          </button>
                          {getStatusOptions(order.status).length > 0 && (
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-secondary dropdown-toggle"
                                data-bs-toggle="dropdown"
                              >
                                Update Status
                              </button>
                              <ul className="dropdown-menu">
                                {getStatusOptions(order.status).map(status => (
                                  <li key={status}>
                                    <button
                                      className="dropdown-item"
                                      onClick={() => handleUpdateStatus(order.id, status)}
                                    >
                                      {status.replace('_', ' ').toUpperCase()}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
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

      {/* Order Details Modal */}
      <OrderDetail
        order={selectedOrder}
        show={showModal}
        onClose={() => setShowModal(false)}
        onUpdate={handleOrderUpdate}
      />
    </div>
  );
};

export default OrderList;
