import React, { useState, useEffect } from 'react';
import { orderAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/helpers';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchCustomerData();
    }
  }, [user]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getByCustomer(user.id);
      const customerOrders = response.data;
      
      setOrders(customerOrders.slice(0, 5)); // Show only recent 5 orders

      // Calculate stats
      const totalOrders = customerOrders.length;
      const pendingOrders = customerOrders.filter(order => 
        ['pending', 'confirmed', 'processing'].includes(order.status)
      ).length;
      const completedOrders = customerOrders.filter(order => 
        order.status === 'delivered'
      ).length;
      const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0);

      setStats({
        totalOrders,
        pendingOrders,
        completedOrders,
        totalSpent
      });
    } catch (error) {
      console.error('Failed to fetch customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Welcome back, {user?.name || user?.email}</h1>
          <p className="text-muted mb-0">Here's what's happening with your orders</p>
        </div>
        <button 
          className="btn btn-outline-primary"
          onClick={fetchCustomerData}
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
                  <h6 className="card-title mb-0">Total Orders</h6>
                  <h2 className="mb-0">{stats.totalOrders}</h2>
                </div>
                <i className="bi bi-cart fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">Pending Orders</h6>
                  <h2 className="mb-0">{stats.pendingOrders}</h2>
                </div>
                <i className="bi bi-clock fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">Completed Orders</h6>
                  <h2 className="mb-0">{stats.completedOrders}</h2>
                </div>
                <i className="bi bi-check-circle fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">Total Spent</h6>
                  <h2 className="mb-0">{formatCurrency(stats.totalSpent)}</h2>
                </div>
                <i className="bi bi-currency-dollar fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Recent Orders */}
        <div className="col-md-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Orders</h5>
              <a href="/customer/orders" className="btn btn-sm btn-outline-primary">
                View All Orders
              </a>
            </div>
            <div className="card-body">
              {orders.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-cart-x fs-1 d-block mb-2"></i>
                  <p className="mb-0">No orders yet</p>
                  <small>Start shopping to see your orders here!</small>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id}>
                          <td>#{order.id}</td>
                          <td>
                            <StatusBadge status={order.status} />
                          </td>
                          <td>{formatCurrency(order.total)}</td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary">
                              View Details
                            </button>
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
                <a href="/customer/qr-scanner" className="btn btn-primary">
                  <i className="bi bi-qr-code me-2"></i>
                  Scan QR Code
                </a>
                <a href="/customer/orders" className="btn btn-outline-primary">
                  <i className="bi bi-cart me-2"></i>
                  View All Orders
                </a>
                <a href="/customer/inquiries" className="btn btn-outline-secondary">
                  <i className="bi bi-chat me-2"></i>
                  Submit Inquiry
                </a>
              </div>
            </div>
          </div>

          {/* Order Status Guide */}
          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">Order Status Guide</h6>
            </div>
            <div className="card-body">
              <div className="small">
                <div className="d-flex align-items-center mb-2">
                  <StatusBadge status="pending" className="me-2" />
                  <span>Order received and being processed</span>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <StatusBadge status="confirmed" className="me-2" />
                  <span>Order confirmed and being prepared</span>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <StatusBadge status="out_for_delivery" className="me-2" />
                  <span>Order is on the way to you</span>
                </div>
                <div className="d-flex align-items-center">
                  <StatusBadge status="delivered" className="me-2" />
                  <span>Order successfully delivered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
