import React, { useState, useEffect } from 'react';
import { Nav, Tab, Row, Col, Button } from 'react-bootstrap';
import { orderAPI, deliveryAPI, userAPI } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/helpers';
import OrderList from '../components/staff/OrderManagement/StaffOrderList';
import DeliveryList from '../components/staff/DeliveryManagement/StaffDeliveryList';
import StaffTestHelper from '../utils/StaffTestHelper';

const StaffDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    pendingDeliveries: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [showTestHelper, setShowTestHelper] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersRes, deliveriesRes] = await Promise.all([
        orderAPI.getAll({ limit: 5 }),
        deliveryAPI.getAll({ status: 'pending' })
      ]);

      // Process orders data
      let ordersData = [];
      if (ordersRes.data && Array.isArray(ordersRes.data)) {
        ordersData = ordersRes.data;
      } else if (ordersRes.data && ordersRes.data.orders) {
        ordersData = ordersRes.data.orders;
      }

      // Calculate order statistics
      const totalOrders = ordersData.length;
      const pendingOrders = ordersData.filter(order => order.status === 'pending').length;
      const processingOrders = ordersData.filter(order => order.status === 'processing').length;

      // Get delivery data
      let deliveriesData = [];
      if (deliveriesRes.data && Array.isArray(deliveriesRes.data)) {
        deliveriesData = deliveriesRes.data;
      } else if (deliveriesRes.data && deliveriesRes.data.deliveries) {
        deliveriesData = deliveriesRes.data.deliveries;
      }

      setStats({
        totalOrders,
        pendingOrders,
        processingOrders,
        pendingDeliveries: deliveriesData.length,
        recentOrders: ordersData.slice(0, 5),
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
            <div className="card bg-warning text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title mb-0">Pending Orders</h6>
                    <h2 className="mb-0">{stats.pendingOrders}</h2>
                  </div>
                  <i className="bi bi-hourglass-split fs-1 opacity-50"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title mb-0">Processing</h6>
                    <h2 className="mb-0">{stats.processingOrders}</h2>
                  </div>
                  <i className="bi bi-gear fs-1 opacity-50"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card bg-success text-white">
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
          <div className="col-md-12">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Orders</h5>
                <Button variant="outline-primary" size="sm" onClick={() => setActiveTab('orders')}>
                  View All Orders
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
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentOrders.map(order => (
                          <tr key={order.id || order._id}>
                            <td>#{order.id || order._id?.substring(0, 6)}</td>
                            <td>{order.customerName || order.customer?.name}</td>
                            <td>
                              <StatusBadge status={order.status} />
                            </td>
                            <td>{formatCurrency(order.total || order.totalAmount)}</td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => setActiveTab('orders')}
                              >
                                Manage
                              </Button>
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
        </div>
      </>
    );
  };

  // Function to test delivery assignment
  const testDeliveryAssignment = async (testOrder, testDeliveryPerson) => {
    try {
      console.log('Running delivery assignment test with:', { testOrder, testDeliveryPerson });
      
      // Create a delivery record
      const deliveryData = {
        order: testOrder.id,
        deliveryPerson: testDeliveryPerson.id,
        status: 'assigned',
        address: testOrder.shippingAddress,
        customerName: testOrder.customerName,
        contactPhone: '',
        items: testOrder.items
      };
      
      console.log('Creating test delivery with data:', deliveryData);
      
      const deliveryResponse = await deliveryAPI.create(deliveryData);
      console.log('Test delivery created:', deliveryResponse);
      
      // Update order status
      await orderAPI.updateStatus(testOrder.id, 'out_for_delivery');
      console.log('Test order status updated to out_for_delivery');
      
      alert('Test successful! Delivery assigned to test order.');
      
      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error('Test delivery assignment failed:', error);
      alert('Test failed. See console for details.');
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Staff Dashboard</h1>
        <Button 
          variant="outline-primary"
          size="sm"
          onClick={() => setShowTestHelper(true)}
        >
          Test Delivery Assignment
        </Button>
      </div>
      
      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Row className="mb-4">
          <Col>
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link eventKey="dashboard">Dashboard</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="orders">Orders</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="deliveries">Deliveries</Nav.Link>
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
              <Tab.Pane eventKey="orders">
                <OrderList />
              </Tab.Pane>
              <Tab.Pane eventKey="deliveries">
                <DeliveryList />
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
      
      {/* Test Helper Modal */}
      <StaffTestHelper 
        show={showTestHelper}
        onClose={() => setShowTestHelper(false)}
        onTestDelivery={testDeliveryAssignment}
      />
    </div>
  );
};

export default StaffDashboard;
