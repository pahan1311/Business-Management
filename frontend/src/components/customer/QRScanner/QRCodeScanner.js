import React, { useState, useEffect } from 'react';
import { useQRScanner } from '../../../hooks/useQRScanner';
import { orderAPI } from '../../../services/api';
import Button from '../../common/Button';
import StatusBadge from '../../common/StatusBadge';
import { formatCurrency, formatDate } from '../../../utils/helpers';

const QRCodeScanner = () => {
  const {
    videoRef,
    isScanning,
    scanResult,
    error,
    hasCamera,
    startScanning,
    stopScanning,
    resetScan
  } = useQRScanner();

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState(null);

  useEffect(() => {
    if (scanResult) {
      handleScanResult(scanResult);
    }
  }, [scanResult]);

  const handleScanResult = async (result) => {
    setLoading(true);
    setScanError(null);
    
    try {
      // Assuming QR code contains order ID
      const orderId = result.replace(/[^0-9]/g, ''); // Extract numbers only
      
      if (!orderId) {
        setScanError('Invalid QR code format');
        return;
      }

      const response = await orderAPI.getById(orderId);
      setOrderDetails(response.data);
    } catch (error) {
      setScanError('Order not found or invalid QR code');
      console.error('Failed to fetch order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartScanning = async () => {
    setScanError(null);
    setOrderDetails(null);
    await startScanning();
  };

  const handleStopScanning = () => {
    stopScanning();
    resetScan();
  };

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="bi bi-qr-code me-2"></i>
                QR Code Scanner
              </h4>
            </div>
            <div className="card-body">
              {!hasCamera && (
                <div className="alert alert-warning" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Camera not detected or not allowed. Please check your camera permissions.
                </div>
              )}

              {hasCamera && (
                <div className="text-center">
                  {!isScanning && !orderDetails && (
                    <div>
                      <i className="bi bi-qr-code-scan display-1 text-primary mb-3 d-block"></i>
                      <p className="lead mb-4">Scan a QR code to view order details</p>
                      <Button 
                        variant="primary" 
                        size="lg" 
                        onClick={handleStartScanning}
                      >
                        <i className="bi bi-camera me-2"></i>
                        Start Scanning
                      </Button>
                    </div>
                  )}

                  {isScanning && (
                    <div>
                      <div className="mb-3">
                        <video
                          ref={videoRef}
                          style={{
                            width: '100%',
                            maxWidth: '400px',
                            height: '300px',
                            border: '2px solid #007bff',
                            borderRadius: '8px'
                          }}
                          autoPlay
                          playsInline
                          muted
                        />
                      </div>
                      
                      <div className="mb-3">
                        <div className="spinner-border text-primary me-2" role="status">
                          <span className="visually-hidden">Scanning...</span>
                        </div>
                        <span>Position the QR code in front of the camera</span>
                      </div>

                      <Button 
                        variant="outline-secondary" 
                        onClick={handleStopScanning}
                      >
                        Stop Scanning
                      </Button>
                    </div>
                  )}

                  {error && (
                    <div className="alert alert-danger mt-3" role="alert">
                      <i className="bi bi-exclamation-circle me-2"></i>
                      Scanner Error: {error}
                    </div>
                  )}

                  {scanError && (
                    <div className="alert alert-warning mt-3" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {scanError}
                    </div>
                  )}

                  {loading && (
                    <div className="mt-3">
                      <div className="spinner-border text-primary me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span>Loading order details...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Order Details */}
              {orderDetails && (
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>Order Details</h5>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => {
                        setOrderDetails(null);
                        resetScan();
                      }}
                    >
                      Scan Another
                    </Button>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h6>Order Information</h6>
                          <p className="mb-1">
                            <strong>Order ID:</strong> #{orderDetails.id}
                          </p>
                          <p className="mb-1">
                            <strong>Status:</strong> <StatusBadge status={orderDetails.status} />
                          </p>
                          <p className="mb-1">
                            <strong>Date:</strong> {formatDate(orderDetails.createdAt)}
                          </p>
                          <p className="mb-0">
                            <strong>Total:</strong> {formatCurrency(orderDetails.total)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h6>Customer Information</h6>
                          <p className="mb-1">
                            <strong>Name:</strong> {orderDetails.customerName || orderDetails.customer?.name}
                          </p>
                          <p className="mb-1">
                            <strong>Email:</strong> {orderDetails.customer?.email}
                          </p>
                          <p className="mb-0">
                            <strong>Phone:</strong> {orderDetails.customer?.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {orderDetails.items && orderDetails.items.length > 0 && (
                    <div className="mt-3">
                      <h6>Order Items</h6>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Quantity</th>
                              <th>Price</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orderDetails.items.map((item, index) => (
                              <tr key={index}>
                                <td>{item.name}</td>
                                <td>{item.quantity}</td>
                                <td>{formatCurrency(item.price)}</td>
                                <td>{formatCurrency(item.quantity * item.price)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="table-active">
                              <th colSpan="3">Total</th>
                              <th>{formatCurrency(orderDetails.total)}</th>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {orderDetails.deliveryAddress && (
                    <div className="mt-3">
                      <h6>Delivery Address</h6>
                      <p className="mb-0">
                        {typeof orderDetails.deliveryAddress === 'object' 
                          ? `${orderDetails.deliveryAddress.street || ''}, 
                             ${orderDetails.deliveryAddress.city || ''}, 
                             ${orderDetails.deliveryAddress.state || ''} 
                             ${orderDetails.deliveryAddress.zip || ''}, 
                             ${orderDetails.deliveryAddress.country || ''}`
                          : orderDetails.deliveryAddress}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="card mt-4">
            <div className="card-header">
              <h6 className="mb-0">How to Use QR Scanner</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 text-center mb-3">
                  <i className="bi bi-1-circle-fill fs-1 text-primary mb-2 d-block"></i>
                  <h6>Click Start Scanning</h6>
                  <small className="text-muted">Allow camera permissions when prompted</small>
                </div>
                <div className="col-md-4 text-center mb-3">
                  <i className="bi bi-2-circle-fill fs-1 text-primary mb-2 d-block"></i>
                  <h6>Position QR Code</h6>
                  <small className="text-muted">Hold the QR code steady in front of camera</small>
                </div>
                <div className="col-md-4 text-center mb-3">
                  <i className="bi bi-3-circle-fill fs-1 text-primary mb-2 d-block"></i>
                  <h6>View Order Details</h6>
                  <small className="text-muted">Order information will be displayed automatically</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;
