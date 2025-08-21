const DeliveryScan = () => {
  return (
    <div>
      <h1>QR Scanner</h1>
      <div className="card">
        <div className="card-body text-center">
          <i className="bi bi-qr-code-scan" style={{ fontSize: '3rem' }}></i>
          <h5 className="mt-3">QR Code Scanner</h5>
          <p>QR scanning implementation coming soon...</p>
          <button className="btn btn-primary">
            <i className="bi bi-camera me-2"></i>
            Start Scanner
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryScan;
