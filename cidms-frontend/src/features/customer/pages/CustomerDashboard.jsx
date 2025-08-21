const CustomerDashboard = () => {
  return (
    <div>
      <h1>My Dashboard</h1>
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>Recent Orders</h5>
            </div>
            <div className="card-body">
              <p>Your recent orders will appear here...</p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button className="btn btn-primary">Track Order</button>
                <button className="btn btn-outline-primary">View Order History</button>
                <button className="btn btn-outline-secondary">Contact Support</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
