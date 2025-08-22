import React, { useState, useEffect } from 'react';
import QRScanner from './QRScanner';
import { apiService } from '../../../services/api';
import StatusBadge from '../../common/StatusBadge';
import { formatDate, formatTime } from '../../../utils/helpers';

const ScanResult = () => {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [deliveryDetails, setDeliveryDetails] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  const handleScanSuccess = async (processedData) => {
    setLoading(true);
    setError('');
    setScanResult(processedData);

    try {
      // Fetch detailed information based on scan result
      await fetchDetails(processedData);
    } catch (err) {
      setError('Failed to fetch details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScanError = (errorMessage) => {
    setError(errorMessage);
    setScanResult(null);
    setOrderDetails(null);
    setDeliveryDetails(null);
  };

  const fetchDetails = async (data) => {
    switch (data.type) {
      case 'order':
        if (data.data.orderId) {
          const response = await apiService.get(`/orders/${data.data.orderId}`);
          setOrderDetails(response.data);
        }
        break;
      
      case 'identifier':
        const id = data.data.id;
        if (id.startsWith('ORD-')) {
          const orderResponse = await apiService.get(`/orders/number/${id}`);
          setOrderDetails(orderResponse.data);
        } else if (id.startsWith('DEL-')) {
          const deliveryResponse = await apiService.get(`/deliveries/number/${id}`);
          setDeliveryDetails(deliveryResponse.data);
        }
        break;
      
      case 'lookup':
        if (data.data.type === 'order') {
          setOrderDetails(data.data);
        } else if (data.data.type === 'delivery') {
          setDeliveryDetails(data.data);
        }
        break;
      
      default:
        // For raw data or URLs, we'll just display the basic info
        break;
    }
  };

  const handleStatusUpdate = async (type, id, newStatus) => {
    setActionInProgress(true);
    try {
      if (type === 'order') {
        await apiService.put(`/orders/${id}/status`, {
          status: newStatus,
          timestamp: new Date().toISOString(),
          scannedBy: 'current-user' // In a real app, get from auth context
        });
        
        // Refresh order details
        const response = await apiService.get(`/orders/${id}`);
        setOrderDetails(response.data);
      } else if (type === 'delivery') {
        await apiService.put(`/deliveries/${id}/status`, {
          status: newStatus,
          timestamp: new Date().toISOString(),
          scannedBy: 'current-user'
        });
        
        // Refresh delivery details
        const response = await apiService.get(`/deliveries/${id}`);
        setDeliveryDetails(response.data);
      }
      
      alert(`Status updated to ${newStatus} successfully!`);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status: ' + error.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleProofOfDelivery = async (deliveryId) => {
    setActionInProgress(true);
    try {
      // In a real app, this would open a camera to take a photo or get signature
      const proofData = {
        type: 'qr_scan',
        timestamp: new Date().toISOString(),
        location: 'current-location', // Would get from GPS
        scannedBy: 'current-user'
      };

      await apiService.post(`/deliveries/${deliveryId}/proof`, proofData);
      await handleStatusUpdate('delivery', deliveryId, 'delivered');
    } catch (error) {
      console.error('Failed to submit proof of delivery:', error);
      alert('Failed to submit proof of delivery: ' + error.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setError('');
    setOrderDetails(null);
    setDeliveryDetails(null);
  };

  const getAvailableActions = () => {
    const actions = [];

    if (orderDetails) {
      switch (orderDetails.status) {
        case 'confirmed':
          actions.push({
            label: 'Mark as Prepared',
            action: () => handleStatusUpdate('order', orderDetails.id, 'prepared'),
            className: 'btn-primary',
            icon: 'check-circle'
          });
          break;
        case 'prepared':
          actions.push({
            label: 'Mark as Picked Up',
            action: () => handleStatusUpdate('order', orderDetails.id, 'picked_up'),
            className: 'btn-info',
            icon: 'box'
          });
          break;
      }
    }

    if (deliveryDetails) {
      switch (deliveryDetails.status) {
        case 'assigned':
          actions.push({
            label: 'Start Delivery',
            action: () => handleStatusUpdate('delivery', deliveryDetails.id, 'in_transit'),
            className: 'btn-primary',
            icon: 'truck'
          });
          break;
        case 'in_transit':
          actions.push({
            label: 'Mark as Delivered',
            action: () => handleProofOfDelivery(deliveryDetails.id),
            className: 'btn-success',
            icon: 'check-lg'
          });
          actions.push({
            label: 'Report Issue',
            action: () => handleStatusUpdate('delivery', deliveryDetails.id, 'failed'),
            className: 'btn-warning',
            icon: 'exclamation-triangle'
          });
          break;
      }
    }

    return actions;
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-6">
          <QRScanner 
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
          />
        </div>

        <div className="col-md-6">
          {/* Scan Results */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Scan Results
              </h5>
              {scanResult && (
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={resetScan}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  New Scan
                </button>
              )}
            </div>

            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Processing scan result...</p>
                </div>
              ) : error ? (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              ) : !scanResult ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-qr-code-scan display-1"></i>
                  <p className="mt-3">Scan a QR code to see the results here</p>
                </div>
              ) : (
                <div>
                  {/* Raw Scan Data */}
                  <div className="mb-4">
                    <h6>Scanned Data Type: 
                      <span className={`badge bg-${
                        scanResult.type === 'order' ? 'primary' :
                        scanResult.type === 'identifier' ? 'info' :
                        scanResult.type === 'lookup' ? 'success' :
                        'secondary'
                      } ms-2`}>
                        {scanResult.type.toUpperCase()}
                      </span>
                    </h6>
                    
                    {scanResult.type === 'raw' && (
                      <div className="bg-light p-3 rounded">
                        <strong>Raw Data:</strong> {scanResult.data.raw}
                      </div>
                    )}
                  </div>

                  {/* Order Details */}
                  {orderDetails && (
                    <div className="mb-4">
                      <h6>
                        <i className="bi bi-receipt me-2"></i>
                        Order Details
                      </h6>
                      <div className="card">
                        <div className="card-body">
                          <div className="row mb-3">
                            <div className="col-6">
                              <strong>Order #:</strong> {orderDetails.orderNumber}
                            </div>
                            <div className="col-6">
                              <StatusBadge status={orderDetails.status} />
                            </div>
                          </div>
                          <div className="row mb-3">
                            <div className="col-6">
                              <strong>Customer:</strong> {orderDetails.customer?.name}
                            </div>
                            <div className="col-6">
                              <strong>Total:</strong> ${orderDetails.total?.toFixed(2)}
                            </div>
                          </div>
                          <div className="row mb-3">
                            <div className="col-6">
                              <strong>Order Date:</strong> {formatDate(orderDetails.orderDate)}
                            </div>
                            <div className="col-6">
                              <strong>Required By:</strong> {formatDate(orderDetails.requiredBy)}
                            </div>
                          </div>
                          
                          {orderDetails.items && (
                            <div>
                              <strong>Items ({orderDetails.items.length}):</strong>
                              <ul className="list-unstyled mt-2">
                                {orderDetails.items.slice(0, 3).map((item, index) => (
                                  <li key={index} className="d-flex justify-content-between">
                                    <span>{item.name}</span>
                                    <span>×{item.quantity}</span>
                                  </li>
                                ))}
                                {orderDetails.items.length > 3 && (
                                  <li className="text-muted">
                                    +{orderDetails.items.length - 3} more items
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivery Details */}
                  {deliveryDetails && (
                    <div className="mb-4">
                      <h6>
                        <i className="bi bi-truck me-2"></i>
                        Delivery Details
                      </h6>
                      <div className="card">
                        <div className="card-body">
                          <div className="row mb-3">
                            <div className="col-6">
                              <strong>Delivery #:</strong> {deliveryDetails.deliveryNumber}
                            </div>
                            <div className="col-6">
                              <StatusBadge status={deliveryDetails.status} />
                            </div>
                          </div>
                          <div className="row mb-3">
                            <div className="col-12">
                              <strong>Address:</strong><br />
                              {deliveryDetails.address?.street}<br />
                              {deliveryDetails.address?.city}, {deliveryDetails.address?.zipCode}
                            </div>
                          </div>
                          <div className="row mb-3">
                            <div className="col-6">
                              <strong>Customer:</strong> {deliveryDetails.customer?.name}
                            </div>
                            <div className="col-6">
                              <strong>Phone:</strong> 
                              <a href={`tel:${deliveryDetails.customer?.phone}`} className="text-decoration-none ms-2">
                                {deliveryDetails.customer?.phone}
                              </a>
                            </div>
                          </div>
                          
                          {deliveryDetails.deliveryInstructions && (
                            <div className="bg-warning bg-opacity-10 p-2 rounded">
                              <strong>Instructions:</strong> {deliveryDetails.deliveryInstructions}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Available Actions */}
                  <div className="mb-4">
                    <h6>
                      <i className="bi bi-gear me-2"></i>
                      Available Actions
                    </h6>
                    {getAvailableActions().length === 0 ? (
                      <div className="text-muted">
                        <i className="bi bi-info-circle me-2"></i>
                        No actions available for this scan result.
                      </div>
                    ) : (
                      <div className="d-grid gap-2">
                        {getAvailableActions().map((action, index) => (
                          <button
                            key={index}
                            className={`btn ${action.className}`}
                            onClick={action.action}
                            disabled={actionInProgress}
                          >
                            {actionInProgress ? (
                              <span className="spinner-border spinner-border-sm me-2"></span>
                            ) : (
                              <i className={`bi bi-${action.icon} me-2`}></i>
                            )}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Additional Information */}
                  <div className="small text-muted">
                    <i className="bi bi-clock me-1"></i>
                    Scanned at {formatTime(new Date())}
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

export default ScanResult;
