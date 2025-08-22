import React, { useState, useEffect } from 'react';
import { deliveryAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate, formatCurrency } from '../utils/helpers';

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    pendingDeliveries: 0,
    inTransitDeliveries: 0,
    completedDeliveries: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchDeliveryData();
    }
  }, [user]);

  const fetchDeliveryData = async () => {
    try {
      setLoading(true);
      const response = await deliveryAPI.getByDeliveryPerson(user.id);
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

  const updateDeliveryStatus = async (deliveryId, status) => {
    try {
      await deliveryAPI.updateStatus(deliveryId, status);
      await fetchDeliveryData(); // Refresh data
    } catch (error) {
      console.error('Failed to update delivery status:', error);
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
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.map(delivery => (
                        <tr key={delivery.id}>
                          <td>#{delivery.orderId}</td>
                          <td>{delivery.customerName}</td>
                          <td>
                            <small>{delivery.address}</small>
                          </td>
                          <td>
                            <StatusBadge status={delivery.status} />
                          </td>
                          <td>{formatCurrency(delivery.orderValue)}</td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              {delivery.status === 'assigned' && (
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => updateDeliveryStatus(delivery.id, 'picked_up')}
                                >
                                  Pick Up
                                </button>
                              )}
                              {delivery.status === 'picked_up' && (
                                <button
                                  className="btn btn-outline-info"
                                  onClick={() => updateDeliveryStatus(delivery.id, 'in_transit')}
                                >
                                  In Transit
                                </button>
                              )}
                              {delivery.status === 'in_transit' && (
                                <button
                                  className="btn btn-outline-success"
                                  onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                                >
                                  Delivered
                                </button>
                              )}
                              <button className="btn btn-outline-secondary">
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
    </div>
  );
};

export default DeliveryDashboard;
