import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../../services/api';
import StatusBadge from '../../common/StatusBadge';
import LoadingSpinner from '../../common/LoadingSpinner';
import { formatDate, formatCurrency } from '../../../utils/helpers';

const OrderStatusDisplay = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderAPI.getById(orderId);
      setOrder(response.data);
    } catch (err) {
      setError('Order not found or you do not have permission to view this order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusProgress = (status) => {
    const statuses = ['pending', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered'];
    const currentIndex = statuses.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statuses.length) * 100 : 0;
  };

  const getStatusSteps = () => [
    { status: 'pending', label: 'Order Placed', icon: 'cart-plus' },
    { status: 'confirmed', label: 'Order Confirmed', icon: 'check-circle' },
    { status: 'processing', label: 'Processing', icon: 'gear' },
    { status: 'ready', label: 'Ready for Pickup', icon: 'box-seam' },
    { status: 'out_for_delivery', label: 'Out for Delivery', icon: 'truck' },
    { status: 'delivered', label: 'Delivered', icon: 'check-circle-fill' }
  ];

  if (loading) {
    return <LoadingSpinner text="Loading order details..." />;
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-circle me-2"></i>
        {error}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="alert alert-warning" role="alert">
        <i className="bi bi-exclamation-triangle me-2"></i>
        No order found with ID: {orderId}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Order Status - #{order.id}</h5>
        {onClose && (
          <button 
            className="btn-close" 
            onClick={onClose}
            aria-label="Close"
          ></button>
        )}
      </div>
      
      <div className="card-body">
        {/* Order Summary */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h6>Order Information</h6>
            <p className="mb-1">
              <strong>Order ID:</strong> #{order.id}
            </p>
            <p className="mb-1">
              <strong>Date:</strong> {formatDate(order.createdAt)}
            </p>
            <p className="mb-1">
              <strong>Total:</strong> {formatCurrency(order.total)}
            </p>
            <p className="mb-1">
              <strong>Status:</strong> <StatusBadge status={order.status} />
            </p>
          </div>
          <div className="col-md-6">
            <h6>Customer Information</h6>
            <p className="mb-1">
              <strong>Name:</strong> {order.customerName || order.customer?.name}
            </p>
            <p className="mb-1">
              <strong>Email:</strong> {order.customer?.email}
            </p>
            <p className="mb-1">
              <strong>Phone:</strong> {order.customer?.phone}
            </p>
          </div>
        </div>

        {/* Status Progress */}
        {order.status !== 'cancelled' && (
          <div className="mb-4">
            <h6>Order Progress</h6>
            <div className="progress mb-3" style={{ height: '8px' }}>
              <div 
                className="progress-bar bg-success" 
                role="progressbar" 
                style={{ width: `${getStatusProgress(order.status)}%` }}
              ></div>
            </div>

            {/* Status Steps */}
            <div className="row">
              {getStatusSteps().map((step, index) => {
                const isCompleted = getStatusSteps().findIndex(s => s.status === order.status) >= index;
                const isCurrent = step.status === order.status;
                
                return (
                  <div key={step.status} className="col-md-2 text-center">
                    <div className={`mb-2 ${isCurrent ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted'}`}>
                      <i className={`bi bi-${step.icon} fs-4`}></i>
                    </div>
                    <small className={isCurrent ? 'fw-bold text-primary' : isCompleted ? 'text-success' : 'text-muted'}>
                      {step.label}
                    </small>
                    {isCurrent && (
                      <div className="mt-1">
                        <span className="badge bg-primary">Current</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cancelled Order Message */}
        {order.status === 'cancelled' && (
          <div className="alert alert-warning" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            This order has been cancelled.
            {order.cancellationReason && (
              <div className="mt-2">
                <strong>Reason:</strong> {order.cancellationReason}
              </div>
            )}
          </div>
        )}

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <div className="mb-4">
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
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>{formatCurrency(item.quantity * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="table-active">
                    <th colSpan="3">Total</th>
                    <th>{formatCurrency(order.total)}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Delivery Information */}
        {order.deliveryAddress && (
          <div className="mb-3">
            <h6>Delivery Address</h6>
            <p className="text-muted">
              {typeof order.deliveryAddress === 'object' 
                ? `${order.deliveryAddress.street || ''}, 
                   ${order.deliveryAddress.city || ''}, 
                   ${order.deliveryAddress.state || ''} 
                   ${order.deliveryAddress.zip || ''}, 
                   ${order.deliveryAddress.country || ''}`
                : order.deliveryAddress}
            </p>
          </div>
        )}

        {/* Estimated Delivery */}
        {order.estimatedDelivery && order.status !== 'delivered' && (
          <div className="alert alert-info" role="alert">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Estimated Delivery:</strong> {formatDate(order.estimatedDelivery)}
          </div>
        )}

        {/* Delivery Confirmation */}
        {order.status === 'delivered' && order.deliveredAt && (
          <div className="alert alert-success" role="alert">
            <i className="bi bi-check-circle me-2"></i>
            <strong>Delivered on:</strong> {formatDate(order.deliveredAt)}
          </div>
        )}

        {/* Order Notes */}
        {order.notes && (
          <div className="mt-3">
            <h6>Order Notes</h6>
            <p className="text-muted">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderStatusDisplay;
