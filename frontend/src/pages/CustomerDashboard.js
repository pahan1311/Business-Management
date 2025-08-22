import React, { useState, useEffect } from 'react';
import { orderAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Container, Row, Col, Card, Nav, Alert } from 'react-bootstrap';
import ProductCatalog from '../components/customer/Products/ProductCatalog';
import ShoppingCart from '../components/customer/Cart/ShoppingCart';
import { useCart } from '../context/CartContext';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const { items, updateQuantity, removeFromCart, clearCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    // Only fetch order data if user is logged in
    if (user?._id) {
      fetchCustomerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      if (!user?._id) {
        return; // Don't proceed if there's no user ID
      }
      
      const response = await orderAPI.getByCustomer(user._id);
      
      // Handle different response structures safely
      const customerOrders = Array.isArray(response.data) 
        ? response.data 
        : response.data?.orders || [];
      
      setOrders(customerOrders.slice(0, 5)); // Show only recent 5 orders

      // Calculate stats
      const totalOrders = customerOrders.length;
      const pendingOrders = customerOrders.filter(order => 
        ['pending', 'confirmed', 'processing'].includes(order.status)
      ).length;
      const completedOrders = customerOrders.filter(order => 
        order.status === 'delivered'
      ).length;
      const totalSpent = customerOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      setStats({
        totalOrders,
        pendingOrders,
        completedOrders,
        totalSpent
      });
    } catch (error) {
      console.error('Failed to fetch customer data:', error);
      // Show empty state when there's an error
      setOrders([]);
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalSpent: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Show a welcome message if no user data is available
  if (!user || !user._id) {
    return (
      <Container fluid className="py-4">
        <div className="text-center">
          <h3>Welcome to the Customer Dashboard</h3>
          <p>Please log in to view your personalized dashboard.</p>
        </div>
      </Container>
    );
  }
  
  // Display error message if there's an error
  if (error) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Welcome back, {user?.name || user?.email}</h1>
          <p className="text-muted mb-0">Browse our products and place your order</p>
        </div>
        <button 
          className="btn btn-outline-primary"
          onClick={fetchCustomerData}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh Orders
        </button>
      </div>

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="bg-primary text-white h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">Total Orders</h6>
                  <h2 className="mb-0">{stats.totalOrders}</h2>
                </div>
                <i className="bi bi-cart fs-1 opacity-50"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="bg-warning text-white h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">Pending Orders</h6>
                  <h2 className="mb-0">{stats.pendingOrders}</h2>
                </div>
                <i className="bi bi-clock fs-1 opacity-50"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="bg-success text-white h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">Completed Orders</h6>
                  <h2 className="mb-0">{stats.completedOrders}</h2>
                </div>
                <i className="bi bi-check2-circle fs-1 opacity-50"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="bg-info text-white h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">Total Spent</h6>
                  <h2 className="mb-0">{formatCurrency(stats.totalSpent)}</h2>
                </div>
                <i className="bi bi-currency-dollar fs-1 opacity-50"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content with Tabs */}
      <Row className="mt-4">
        <Col lg={8} className="mb-4 mb-lg-0">
          <Card className="h-100">
            <Card.Header>
              <Nav variant="tabs" className="border-bottom-0">
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'products'} 
                    onClick={() => setActiveTab('products')}
                    className="border-0"
                  >
                    <i className="bi bi-grid me-2"></i>
                    Products
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'orders'} 
                    onClick={() => setActiveTab('orders')}
                    className="border-0"
                  >
                    <i className="bi bi-list-check me-2"></i>
                    My Orders
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>
            <Card.Body className="p-0">
              {activeTab === 'products' ? (
                <div className="p-3">
                  <ProductCatalog />
                </div>
              ) : (
                <div className="p-3">
                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3">Loading your orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-receipt fs-1 text-muted mb-3"></i>
                      <h4>No Orders Yet</h4>
                      <p className="text-muted">
                        You haven't placed any orders yet. Start shopping now!
                      </p>
                      <button 
                        className="btn btn-primary mt-2" 
                        onClick={() => setActiveTab('products')}
                      >
                        Browse Products
                      </button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead>
                          <tr>
                            <th>Order #</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(order => (
                            <tr key={order._id}>
                              <td>
                                <span className="fw-bold">#{order._id.slice(-6)}</span>
                              </td>
                              <td>{formatDate(order.createdAt)}</td>
                              <td>{order.items.length}</td>
                              <td>{formatCurrency(order.totalAmount)}</td>
                              <td>
                                <StatusBadge status={order.status} />
                              </td>
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
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <ShoppingCart 
            cartItems={items} 
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            clearCart={clearCart}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default CustomerDashboard;
