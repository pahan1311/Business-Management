import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingBlock from '../../../components/common/LoadingBlock';

const CustomerDashboard = () => {
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call for dashboard data
    const fetchDashboardData = async () => {
      try {
        // In a real app, this would be an API call
        setTimeout(() => {
          setRecentOrders([
            { id: 'ORD123', date: '2025-08-20', status: 'delivered', total: '$299.99' },
            { id: 'ORD456', date: '2025-08-15', status: 'processing', total: '$149.50' }
          ]);
          
          setRecentInquiries([
            { id: 'INQ001', subject: 'Damaged Product', status: 'open', date: '2025-08-15' },
            { id: 'INQ002', subject: 'Delivery Delay', status: 'in-progress', date: '2025-08-10' }
          ]);
          
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingBlock message="Loading your dashboard..." />;
  }

  return (
    <div>
      <h1>My Dashboard</h1>
      
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Orders</h5>
              <Link to="/customer/orders" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {recentOrders.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td><Link to={`/customer/orders/${order.id}`}>{order.id}</Link></td>
                          <td>{order.date}</td>
                          <td><span className={`badge bg-${order.status === 'delivered' ? 'success' : 'primary'}`}>{order.status}</span></td>
                          <td>{order.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No recent orders found.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Inquiries</h5>
              <Link to="/customer/inquiries" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {recentInquiries.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInquiries.map((inquiry) => (
                        <tr key={inquiry.id}>
                          <td>{inquiry.id}</td>
                          <td>{inquiry.subject}</td>
                          <td>
                            <span className={`badge bg-${
                              inquiry.status === 'open' ? 'danger' : 
                              inquiry.status === 'in-progress' ? 'warning' : 
                              'success'
                            }`}>
                              {inquiry.status}
                            </span>
                          </td>
                          <td>{inquiry.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No inquiries found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6 offset-md-3">
          <div className="card">
            <div className="card-header">
              <h5>Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link to="/customer/scan" className="btn btn-primary">Scan QR Code</Link>
                <Link to="/customer/orders" className="btn btn-outline-primary">View Order History</Link>
                <Link to="/customer/inquiries" className="btn btn-outline-secondary">Contact Support</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
