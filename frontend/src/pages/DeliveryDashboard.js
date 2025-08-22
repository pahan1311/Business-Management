import React, { useState, useEffect } from 'react';
import { deliveryAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../context/AppContext';
import { Modal, Button } from 'react-bootstrap';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/helpers';

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const { addNotification } = useApp();
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    pendingDeliveries: 0,
    inTransitDeliveries: 0,
    completedDeliveries: 0
  });
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [actionType, setActionType] = useState(null); // 'accept' or 'reject'

  useEffect(() => {
    if (user?._id || user?.id) {
      fetchDeliveryData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDeliveryData = async () => {
    try {
      setLoading(true);
      const userId = user._id || user.id;
      const response = await deliveryAPI.getByDeliveryPerson(userId);
      const deliveryTasks = response.data;
      
      setDeliveries(deliveryTasks.slice(0, 10)); // Show recent deliveries

      // Calculate stats
      const totalDeliveries = deliveryTasks.length;
      const pendingDeliveries = deliveryTasks.filter(delivery => 
        delivery.status === 'assigned'
      ).length;
      const inTransitDeliveries = deliveryTasks.filter(delivery => 
        ['picked_up', 'in_transit'].includes(delivery.status)
      ).length;
      const completedDeliveries = deliveryTasks.filter(delivery => 
        delivery.status === 'delivered'
      ).length;

      setStats({
        totalDeliveries,
        pendingDeliveries,
        inTransitDeliveries,
        completedDeliveries
      });
    } catch (error) {
      console.error('Failed to fetch delivery data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAcceptDelivery = (delivery) => {
    setSelectedDelivery(delivery);
    setActionType('accept');
    setShowConfirmModal(true);
  };
  
  const handleRejectDelivery = (delivery) => {
    setSelectedDelivery(delivery);
    setActionType('reject');
    setShowConfirmModal(true);
  };
  
  const handleViewDetails = (delivery) => {
    setSelectedDelivery(delivery);
    setShowDetailsModal(true);
  };
  
  const confirmAction = async () => {
    try {
      if (actionType === 'accept') {
        await deliveryAPI.updateStatus(selectedDelivery._id, 'picked_up');
        addNotification({
          type: 'success',
          message: 'Delivery accepted successfully'
        });
      } else if (actionType === 'reject') {
        await deliveryAPI.updateStatus(selectedDelivery._id, 'rejected');
        addNotification({
          type: 'info',
          message: 'Delivery rejected'
        });
      }
      
      await fetchDeliveryData(); // Refresh data
    } catch (error) {
      console.error('Error updating delivery:', error);
      addNotification({
        type: 'error',
        message: `Failed to ${actionType} delivery`
      });
    } finally {
      setShowConfirmModal(false);
      setSelectedDelivery(null);
    }
  };

  const updateDeliveryStatus = async (deliveryId, status) => {
    try {
      await deliveryAPI.updateStatus(deliveryId, status);
      addNotification({
        type: 'success',
        message: `Delivery status updated to ${status.replace('_', ' ')}`
      });
      await fetchDeliveryData(); // Refresh data
    } catch (error) {
      console.error('Failed to update delivery status:', error);
      addNotification({
        type: 'error',
        message: 'Failed to update delivery status'
      });
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Delivery Dashboard</h1>
          <p className="text-muted mb-0">Welcome back, {user?.name || user?.email}</p>
        </div>
        <button 
          className="btn btn-outline-primary"
          onClick={fetchDeliveryData}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">Total Deliveries</h6>
                  <h2 className="mb-0">{stats.totalDeliveries}</h2>
                </div>
                <i className="bi bi-truck fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">Pending</h6>
                  <h2 className="mb-0">{stats.pendingDeliveries}</h2>
                </div>
                <i className="bi bi-clock fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">In Transit</h6>
                  <h2 className="mb-0">{stats.inTransitDeliveries}</h2>
                </div>
                <i className="bi bi-arrow-right fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">Completed</h6>
                  <h2 className="mb-0">{stats.completedDeliveries}</h2>
                </div>
                <i className="bi bi-check-circle fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Delivery Tasks */}
        <div className="col-md-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">My Delivery Tasks</h5>
              <a href="/delivery/tasks" className="btn btn-sm btn-outline-primary">
                View All Tasks
              </a>
            </div>
            <div className="card-body">
              {deliveries.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-truck fs-1 d-block mb-2"></i>
                  <p className="mb-0">No delivery tasks assigned</p>
                  <small>Delivery tasks will appear here when assigned to you</small>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Address</th>
                        <th>Status</th>
                        <th>Value</th>
                        <th>Scheduled</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.map((delivery, index) => (
                        <tr key={delivery._id || delivery.id || `delivery-${index}`}>
                          <td>#{delivery.orderId}</td>
                          <td>{delivery.customerName}</td>
                          <td>
                            <small>
                              {typeof delivery.address === 'object' 
                                ? `${delivery.address.street || ''}, 
                                   ${delivery.address.city || ''}${delivery.address.city && delivery.address.state ? ', ' : ''} 
                                   ${delivery.address.state || ''}${(delivery.address.state || delivery.address.city) && delivery.address.zip ? ' ' : ''}
                                   ${delivery.address.zip || ''}`
                                : delivery.address || 'No address'}
                            </small>
                          </td>
                          <td>
                            <StatusBadge status={delivery.status} />
                          </td>
                          <td>{formatCurrency(delivery.orderValue)}</td>
                          <td>{delivery.scheduledDate ? formatDate(delivery.scheduledDate) : 'ASAP'}</td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              {delivery.status === 'assigned' && (
                                <>
                                  <button
                                    className="btn btn-outline-success"
                                    onClick={() => handleAcceptDelivery(delivery)}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() => handleRejectDelivery(delivery)}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {delivery.status === 'picked_up' && (
                                <button
                                  className="btn btn-outline-info"
                                  onClick={() => updateDeliveryStatus(delivery._id, 'in_transit')}
                                >
                                  In Transit
                                </button>
                              )}
                              {delivery.status === 'in_transit' && (
                                <button
                                  className="btn btn-outline-success"
                                  onClick={() => updateDeliveryStatus(delivery._id, 'delivered')}
                                >
                                  Delivered
                                </button>
                              )}
                              <button 
                                className="btn btn-outline-secondary"
                                onClick={() => handleViewDetails(delivery)}
                              >
                                Details
                              </button>
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
        </div>

        {/* Quick Actions */}
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <a href="/delivery/qr-scanner" className="btn btn-primary">
                  <i className="bi bi-qr-code me-2"></i>
                  Scan QR Code
                </a>
                <a href="/delivery/tasks" className="btn btn-outline-primary">
                  <i className="bi bi-truck me-2"></i>
                  View All Tasks
                </a>
                <a href="/delivery/issues" className="btn btn-outline-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Report Issue
                </a>
              </div>
            </div>
          </div>

          {/* Delivery Status Guide */}
          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">Delivery Process</h6>
            </div>
            <div className="card-body">
              <div className="small">
                <div className="d-flex align-items-center mb-2">
                  <StatusBadge status="assigned" className="me-2" />
                  <span>Task assigned to you</span>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <StatusBadge status="picked_up" className="me-2" />
                  <span>Order picked up from location</span>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <StatusBadge status="in_transit" className="me-2" />
                  <span>On the way to customer</span>
                </div>
                <div className="d-flex align-items-center">
                  <StatusBadge status="delivered" className="me-2" />
                  <span>Successfully delivered</span>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Summary */}
          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">Today's Summary</h6>
            </div>
            <div className="card-body">
              <div className="text-center">
                <div className="row">
                  <div className="col-6">
                    <div className="border-end">
                      <h4 className="mb-0 text-success">{stats.completedDeliveries}</h4>
                      <small className="text-muted">Completed</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <h4 className="mb-0 text-warning">{stats.pendingDeliveries}</h4>
                    <small className="text-muted">Pending</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {actionType === 'accept' ? 'Accept Delivery' : 'Reject Delivery'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDelivery && (
            <div>
              <p>Are you sure you want to {actionType} this delivery?</p>
              <p><strong>Order ID:</strong> {selectedDelivery.orderId}</p>
              <p><strong>Customer:</strong> {selectedDelivery.customerName}</p>
              {actionType === 'reject' && (
                <div className="alert alert-warning">
                  Rejecting this delivery will make it available for other delivery personnel.
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button 
            variant={actionType === 'accept' ? 'success' : 'danger'} 
            onClick={confirmAction}
          >
            {actionType === 'accept' ? 'Accept' : 'Reject'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Delivery Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delivery Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDelivery && (
            <div>
              <div className="mb-3">
                <h5>Order Information</h5>
                <p className="mb-1"><strong>Order ID:</strong> #{selectedDelivery.orderId}</p>
                <p className="mb-1"><strong>Status:</strong> <StatusBadge status={selectedDelivery.status} /></p>
                <p className="mb-1"><strong>Total Value:</strong> {formatCurrency(selectedDelivery.orderValue)}</p>
              </div>
              
              <div className="mb-3">
                <h5>Customer Information</h5>
                <p className="mb-1"><strong>Name:</strong> {selectedDelivery.customerName}</p>
                <p className="mb-1"><strong>Phone:</strong> {selectedDelivery.contactPhone || 'N/A'}</p>
                <p className="mb-1"><strong>Address:</strong></p>
                <div className="alert alert-light">
                  {typeof selectedDelivery.address === 'object' 
                    ? (<>
                        {selectedDelivery.address.street || ''}<br />
                        {selectedDelivery.address.city || ''}{selectedDelivery.address.city && selectedDelivery.address.state ? ', ' : ''} 
                        {selectedDelivery.address.state || ''} {selectedDelivery.address.zip || ''}<br />
                        {selectedDelivery.address.country || ''}
                      </>)
                    : selectedDelivery.address || 'No address provided'
                  }
                </div>
              </div>
              
              {selectedDelivery.items && selectedDelivery.items.length > 0 && (
                <div className="mb-3">
                  <h5>Items</h5>
                  <ul className="list-group">
                    {selectedDelivery.items.map((item, idx) => (
                      <li key={`item-${idx}`} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <span className="fw-bold">{item.name}</span>
                          <br />
                          <small>{formatCurrency(item.price)} x {item.quantity}</small>
                        </div>
                        <span className="fw-bold">{formatCurrency(item.price * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedDelivery.notes && (
                <div className="mb-3">
                  <h5>Notes</h5>
                  <div className="alert alert-info">
                    {selectedDelivery.notes}
                  </div>
                </div>
              )}
              
              <div className="mb-3">
                <h5>Delivery Timeline</h5>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    <strong>Created:</strong> {formatDate(selectedDelivery.createdAt)}
                  </li>
                  {selectedDelivery.scheduledDate && (
                    <li className="mb-2">
                      <i className="bi bi-calendar me-2"></i>
                      <strong>Scheduled:</strong> {formatDate(selectedDelivery.scheduledDate)}
                    </li>
                  )}
                  {selectedDelivery.deliveredAt && (
                    <li className="mb-2">
                      <i className="bi bi-truck me-2"></i>
                      <strong>Delivered:</strong> {formatDate(selectedDelivery.deliveredAt)}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          {selectedDelivery?.status === 'picked_up' && (
            <Button 
              variant="info" 
              onClick={() => {
                updateDeliveryStatus(selectedDelivery._id, 'in_transit');
                setShowDetailsModal(false);
              }}
            >
              Mark In Transit
            </Button>
          )}
          {selectedDelivery?.status === 'in_transit' && (
            <Button 
              variant="success" 
              onClick={() => {
                updateDeliveryStatus(selectedDelivery._id, 'delivered');
                setShowDetailsModal(false);
              }}
            >
              Mark Delivered
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DeliveryDashboard;
