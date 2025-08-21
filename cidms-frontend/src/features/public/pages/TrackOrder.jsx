import { useSearchParams } from 'react-router-dom';

const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t');

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body text-center p-5">
              <i className="bi bi-truck" style={{ fontSize: '4rem', color: '#0d6efd' }}></i>
              <h2 className="mt-3">Track Your Order</h2>
              {token ? (
                <div>
                  <p className="text-muted">Tracking token: {token}</p>
                  <p>Order tracking implementation coming soon...</p>
                </div>
              ) : (
                <div>
                  <p className="text-muted">Enter your tracking code or scan QR code</p>
                  <div className="mt-4">
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Enter tracking code"
                    />
                    <button className="btn btn-primary mt-3">Track Order</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
