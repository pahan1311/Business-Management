import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import QRScanner from '../../../components/common/QRScanner';
import { useGetDeliveryByQRQuery } from '../api';

const DeliveryQRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const { 
    data: deliveryData, 
    isLoading: isLoadingDelivery, 
    error: deliveryError 
  } = useGetDeliveryByQRQuery(scanResult, {
    skip: !scanResult
  });

  const handleScan = (result) => {
    setScanResult(result);
    setIsScanning(false);
  };

  const handleScanAgain = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  const handleGoToDelivery = () => {
    if (deliveryData?.delivery) {
      navigate(`/delivery/deliveries/${deliveryData.delivery.id}`);
    }
  };

  return (
    <div className="delivery-qr-scanner">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>QR Code Scanner</h1>
          <p className="text-muted mb-0">
            Scan delivery QR codes to quickly access delivery details
          </p>
        </div>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate('/delivery/deliveries')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Deliveries
        </button>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          {isScanning ? (
            <div className="card">
              <div className="card-header bg-primary bg-opacity-10">
                <h5 className="mb-0 text-primary">
                  <i className="bi bi-camera me-2"></i>
                  Scanning for QR Code
                </h5>
              </div>
              <div className="card-body">
                <div className="alert alert-info mb-4">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Instructions:</strong>
                  <ul className="mb-0 mt-2">
                    <li>Position the QR code within the camera frame</li>
                    <li>Make sure there's adequate lighting</li>
                    <li>Hold your device steady</li>
                    <li>The scanner will automatically detect valid QR codes</li>
                  </ul>
                </div>
                
                <QRScanner
                  onScan={handleScan}
                  onClose={() => navigate('/delivery/deliveries')}
                />
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header bg-success bg-opacity-10">
                <h5 className="mb-0 text-success">
                  <i className="bi bi-check-circle me-2"></i>
                  QR Code Scanned
                </h5>
              </div>
              <div className="card-body">
                <div className="alert alert-light border mb-4">
                  <h6>Scanned Data:</h6>
                  <code className="bg-light p-2 rounded d-block">
                    {scanResult}
                  </code>
                </div>

                {isLoadingDelivery && (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading delivery...</span>
                    </div>
                    <p className="mt-2 text-muted">Looking up delivery information...</p>
                  </div>
                )}

                {deliveryError && (
                  <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>QR Code Not Found</strong>
                    <p className="mb-0 mt-2">
                      This QR code doesn't match any delivery in the system. Please try scanning again or check with dispatch.
                    </p>
                  </div>
                )}

                {deliveryData?.delivery && (
                  <div className="alert alert-success">
                    <i className="bi bi-check-circle me-2"></i>
                    <strong>Delivery Found!</strong>
                    
                    <div className="mt-3">
                      <h6>Delivery Information:</h6>
                      <div className="row g-2">
                        <div className="col-sm-6">
                          <strong>Order:</strong> #{deliveryData.delivery.orderNumber}
                        </div>
                        <div className="col-sm-6">
                          <strong>Customer:</strong> {deliveryData.delivery.customerName}
                        </div>
                        <div className="col-sm-6">
                          <strong>Status:</strong> 
                          <span className={`badge ms-2 ${
                            deliveryData.delivery.status === 'ASSIGNED' ? 'bg-primary' :
                            deliveryData.delivery.status === 'IN_TRANSIT' ? 'bg-warning' :
                            deliveryData.delivery.status === 'DELIVERED' ? 'bg-success' :
                            'bg-secondary'
                          }`}>
                            {deliveryData.delivery.status}
                          </span>
                        </div>
                        <div className="col-sm-6">
                          <strong>Area:</strong> {deliveryData.delivery.deliveryArea}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="d-flex gap-2 mt-4">
                  {deliveryData?.delivery && (
                    <button
                      className="btn btn-primary"
                      onClick={handleGoToDelivery}
                    >
                      <i className="bi bi-eye me-2"></i>
                      View Delivery Details
                    </button>
                  )}
                  <button
                    className="btn btn-outline-primary"
                    onClick={handleScanAgain}
                  >
                    <i className="bi bi-qr-code-scan me-2"></i>
                    Scan Another Code
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/delivery/deliveries')}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Deliveries
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-lightbulb me-2"></i>
                QR Code Scanner Tips
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="text-center">
                    <i className="bi bi-camera fs-1 text-primary mb-2"></i>
                    <h6>Good Lighting</h6>
                    <p className="text-muted small mb-0">
                      Make sure the QR code is well-lit for best results
                    </p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center">
                    <i className="bi bi-aspect-ratio fs-1 text-success mb-2"></i>
                    <h6>Proper Distance</h6>
                    <p className="text-muted small mb-0">
                      Keep the code within the scanner frame boundaries
                    </p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center">
                    <i className="bi bi-hand-thumbs-up fs-1 text-info mb-2"></i>
                    <h6>Stay Steady</h6>
                    <p className="text-muted small mb-0">
                      Hold your device steady until the scan completes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryQRScanner;
