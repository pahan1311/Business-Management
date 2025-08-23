import React, { useState, useEffect } from 'react';
import { Nav, Tab, Row, Col, Button } from 'react-bootstrap';
import { orderAPI, customerAPI, inventoryAPI, deliveryAPI } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/helpers';
import CustomerList from '../components/admin/CustomerManagement/CustomerList';
import StaffList from '../components/admin/StaffManagement/StaffList';
import OrderList from '../components/admin/OrderManagement/OrderList';
import InventoryList from '../components/admin/InventoryManagement/InventoryList';
import DeliveryPersonList from '../components/admin/DeliveryManagement/DeliveryPersonList';
import GoogleDriveTest from '../components/common/GoogleDriveTest';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
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
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Use individual try/catch blocks for each API call
      let ordersRes = { data: [] };
      let customersRes = { data: [] };
      let inventoryRes = { data: [] };
      let deliveriesRes = { data: [] };
      
      try {
        ordersRes = await orderAPI.getAll({ limit: 5 });
      } catch (err) {
        console.error('Error fetching orders:', err);
      }
      
      try {
        customersRes = await customerAPI.getAll();
      } catch (err) {
        console.error('Error fetching customers:', err);
      }
      
      try {
        // Fetch all inventory items for accurate product count
        inventoryRes = await inventoryAPI.getAll();
        
        // Also fetch low stock items for the low stock section
        const lowStockRes = await inventoryAPI.getLowStock();
        // Store low stock items separately
        inventoryRes.lowStockItems = lowStockRes.data || [];
      } catch (err) {
        console.error('Error fetching inventory:', err);
      }
      
      try {
        deliveriesRes = await deliveryAPI.getAll({ status: 'pending' });
      } catch (err) {
        console.error('Error fetching deliveries:', err);
      }

      // Handle various response formats
      const ordersData = ordersRes.data || {};
      const customersData = customersRes.data || [];
      const inventoryData = inventoryRes.data || [];
      const deliveriesData = deliveriesRes.data || [];
      
      // Calculate counts safely
      const orderCount = ordersData.total || (Array.isArray(ordersData) ? ordersData.length : 0);
      const customerCount = Array.isArray(customersData) ? customersData.length : 0;
      
      // Get product count from inventory response
      const productCount = inventoryData.total || 
                         (inventoryData.items ? inventoryData.items.length : 
                          (Array.isArray(inventoryData) ? inventoryData.length : 0));
      
      const deliveryCount = Array.isArray(deliveriesData) ? deliveriesData.length : 0;
      
      // Get recent orders safely
      const recentOrders = ordersData.orders || 
                         (Array.isArray(ordersData) ? ordersData.slice(0, 5) : []);
      
      // Get low stock items safely
      const lowStock = inventoryRes.lowStockItems && Array.isArray(inventoryRes.lowStockItems) 
                     ? inventoryRes.lowStockItems.slice(0, 5) 
                     : [];

      setStats({
        totalOrders: orderCount,
        totalCustomers: customerCount,
        totalProducts: productCount,
        pendingDeliveries: deliveryCount,
        recentOrders: recentOrders,
        lowStockItems: lowStock
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => {
    if (loading) {
      return <LoadingSpinner text="Loading dashboard..." />;
    }

    return (
      <>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Overview</h2>
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
          <div className="card bg-warning text-white position-relative">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">Pending Deliveries</h6>
                  <h2 className="mb-0">{stats.pendingDeliveries}</h2>
                </div>
                <i className="bi bi-truck fs-1 opacity-50"></i>
              </div>
              <Button
                variant="light"
                size="sm"
                className="position-absolute bottom-0 end-0 m-2"
                onClick={() => setActiveTab('delivery')}
              >
                <i className="bi bi-person-badge me-1"></i>
                Delivery Staff
              </Button>
            </div>
          </div>
        </div>
      </div>        <div className="row g-4">
          {/* Recent Orders */}
          <div className="col-md-8">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Orders</h5>
                <Button variant="outline-primary" size="sm" onClick={() => setActiveTab('orders')}>
                  View All
                </Button>
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
                        {stats.recentOrders.map((order, index) => (
                          <tr key={order._id || order.id || `order-${index}`}>
                            <td>#{order._id?.substring(0, 6) || order.id?.substring(0, 6) || `OR${index}`}</td>
                            <td>{order.customerName || order.customer?.name || "Customer"}</td>
                            <td>
                              <StatusBadge status={order.status} />
                            </td>
                            <td>{formatCurrency(order.total || order.totalAmount || 0)}</td>
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
                <Button variant="outline-warning" size="sm" onClick={() => setActiveTab('inventory')}>
                  Manage Stock
                </Button>
              </div>
              <div className="card-body">
                {stats.lowStockItems.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-check-circle fs-1 d-block mb-2 text-success"></i>
                    All items in stock
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {stats.lowStockItems.map((item, index) => (
                      <div key={item._id || item.id || `lowstock-item-${index}`} className="list-group-item px-0">
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
      </>
    );
  };

  return (
    <div className="container-fluid py-4">
      <h1 className="mb-4">Admin Dashboard</h1>
      
      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Row className="mb-4">
          <Col>
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link eventKey="dashboard">Dashboard</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="customers">Customers</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="staff">Staff</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="orders">Orders / Deliveries</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="inventory">Inventory</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="delivery">Delivery Staff</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="google-test">Google Drive Test</Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
        </Row>
        <Row>
          <Col>
            <Tab.Content>
              <Tab.Pane eventKey="dashboard">
                {renderDashboard()}
              </Tab.Pane>
              <Tab.Pane eventKey="customers">
                <CustomerList />
              </Tab.Pane>
              <Tab.Pane eventKey="staff">
                <StaffList />
              </Tab.Pane>
              <Tab.Pane eventKey="orders">
                <OrderList />
              </Tab.Pane>
              <Tab.Pane eventKey="inventory">
                <InventoryList />
              </Tab.Pane>
              <Tab.Pane eventKey="delivery">
                <DeliveryPersonList />
              </Tab.Pane>
              <Tab.Pane eventKey="google-test">
                <GoogleDriveTest />
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </div>
  );
};

export default AdminDashboard;
