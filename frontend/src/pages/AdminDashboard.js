import React, { useState, useEffect } from 'react';
import { orderAPI, customerAPI, inventoryAPI, deliveryAPI } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/helpers';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingDeliveries: 0,
    recentOrders: [],
    lowStockItems: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersRes, customersRes, inventoryRes, deliveriesRes] = await Promise.all([
        orderAPI.getAll({ limit: 5 }),
        customerAPI.getAll(),
        inventoryAPI.getLowStock(),
        deliveryAPI.getAll({ status: 'pending' })
      ]);

      setStats({
        totalOrders: ordersRes.data.total || ordersRes.data.length,
        totalCustomers: customersRes.data.length,
        totalProducts: inventoryRes.data.length,
        pendingDeliveries: deliveriesRes.data.length,
        recentOrders: ordersRes.data.orders || ordersRes.data.slice(0, 5),
        lowStockItems: inventoryRes.data.slice(0, 5)
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Admin Dashboard</h1>
        <button 
          className="btn btn-outline-primary"
          onClick={fetchDashboardData}
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
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">Total Customers</h6>
                  <h2 className="mb-0">{stats.totalCustomers}</h2>
                </div>
                <i className="bi bi-people fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">Products</h6>
                  <h2 className="mb-0">{stats.totalProducts}</h2>
                </div>
                <i className="bi bi-box-seam fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">Pending Deliveries</h6>
                  <h2 className="mb-0">{stats.pendingDeliveries}</h2>
                </div>
                <i className="bi bi-truck fs-1 opacity-50"></i>
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
              <a href="/admin/orders" className="btn btn-sm btn-outline-primary">
                View All
              </a>
            </div>
            <div className="card-body">
              {stats.recentOrders.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-cart-x fs-1 d-block mb-2"></i>
                  No recent orders
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentOrders.map(order => (
                        <tr key={order.id}>
                          <td>#{order.id}</td>
                          <td>{order.customerName || order.customer?.name}</td>
                          <td>
                            <StatusBadge status={order.status} />
                          </td>
                          <td>{formatCurrency(order.total)}</td>
                          <td>{formatDate(order.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="col-md-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Low Stock Alert</h5>
              <a href="/admin/inventory" className="btn btn-sm btn-outline-warning">
                Manage Stock
              </a>
            </div>
            <div className="card-body">
              {stats.lowStockItems.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-check-circle fs-1 d-block mb-2 text-success"></i>
                  All items in stock
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {stats.lowStockItems.map(item => (
                    <div key={item.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{item.name}</h6>
                          <small className="text-muted">
                            Stock: {item.quantity} / Min: {item.minStock}
                          </small>
                        </div>
                        <span className="badge bg-warning">Low</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row g-4 mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <a href="/admin/orders" className="btn btn-outline-primary w-100">
                    <i className="bi bi-cart me-2"></i>
                    Manage Orders
                  </a>
                </div>
                <div className="col-md-3">
                  <a href="/admin/customers" className="btn btn-outline-success w-100">
                    <i className="bi bi-people me-2"></i>
                    Manage Customers
                  </a>
                </div>
                <div className="col-md-3">
                  <a href="/admin/inventory" className="btn btn-outline-info w-100">
                    <i className="bi bi-box-seam me-2"></i>
                    Manage Inventory
                  </a>
                </div>
                <div className="col-md-3">
                  <a href="/admin/staff" className="btn btn-outline-warning w-100">
                    <i className="bi bi-person-badge me-2"></i>
                    Manage Staff
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
