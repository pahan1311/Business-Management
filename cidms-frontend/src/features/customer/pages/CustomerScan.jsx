const CustomerScan = () => {
  return (
    <div>
      <h1>Track Order</h1>
      <div className="card">
        <div className="card-body text-center">
          <i className="bi bi-qr-code-scan" style={{ fontSize: '3rem' }}></i>
          <h5 className="mt-3">Scan QR Code to Track</h5>
          <p>Scan the QR code on your order receipt to track your delivery.</p>
          <button className="btn btn-primary">
            <i className="bi bi-camera me-2"></i>
            Start Scanner
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerScan;
