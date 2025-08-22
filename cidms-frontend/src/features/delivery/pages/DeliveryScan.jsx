import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../../../components/common/QRScanner';
import LoadingBlock from '../../../components/common/LoadingBlock';
import ErrorState from '../../../components/common/ErrorState';
import toast from '../../../utils/toast';

const DeliveryScan = () => {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [deliveryData, setDeliveryData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // If we have scan results, fetch delivery data
    if (scanResult) {
      fetchDeliveryData(scanResult);
    }
  }, [scanResult]);

  const startScanner = () => {
    setScanning(true);
  };

  const handleScan = (data) => {
    if (data) {
      setScanning(false);
      setLoading(true);
      setScanResult(data);
    }
  };

  const fetchDeliveryData = (qrData) => {
    // Simulate API call to get delivery data
    setTimeout(() => {
      try {
        // Expected format: delivery:ID or order:ID
        const [type, id] = qrData.split(':');
        
        if (!type || !id) {
          throw new Error('Invalid QR code format');
        }
        
        // Mock data for demonstration
        const mockDelivery = {
          id: id,
          orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          customer: {
            name: 'John Doe',
            address: '123 Main St, Cityville',
            phone: '(555) 123-4567'
          },
          status: 'out-for-delivery',
          items: [
            { name: 'Product A', quantity: 2 },
            { name: 'Product B', quantity: 1 }
          ]
        };
        
        setDeliveryData(mockDelivery);
        setLoading(false);
        toast.success('Delivery information found!');
      } catch (error) {
        toast.error('Error processing QR code: ' + error.message);
        setLoading(false);
        setScanResult(null);
      }
    }, 1000);
  };

  const handleStatusUpdate = (newStatus) => {
    setLoading(true);
    
    // Simulate API call to update status
    setTimeout(() => {
      setDeliveryData(prev => ({
        ...prev,
        status: newStatus
      }));
      setLoading(false);
      toast.success(`Delivery status updated to: ${newStatus}`);
    }, 800);
  };

  const handleError = (error) => {
    toast.error('QR Scanner error: ' + error.message);
    setScanning(false);
  };

  const handleClose = () => {
    setScanning(false);
  };

  const handleReset = () => {
    setScanResult(null);
    setDeliveryData(null);
  };
  
  return (
    <div className="delivery-scan-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>QR Scanner</h1>
        {deliveryData && (
          <button className="btn btn-outline-secondary" onClick={handleReset}>
            <i className="bi bi-arrow-counterclockwise me-1"></i>
            Scan New Package
          </button>
        )}
      </div>

      {loading ? (
        <LoadingBlock text="Processing..." />
      ) : deliveryData ? (
        <div className="card">
          <div className="card-header bg-light d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Delivery Information</h5>
            <span className="badge bg-primary">{deliveryData.id}</span>
          </div>
          <div className="card-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Customer Details</h6>
                <p><strong>Name:</strong> {deliveryData.customer.name}</p>
                <p><strong>Address:</strong> {deliveryData.customer.address}</p>
                <p><strong>Phone:</strong> {deliveryData.customer.phone}</p>
              </div>
              <div className="col-md-6">
                <h6>Order Information</h6>
                <p><strong>Order Number:</strong> {deliveryData.orderNumber}</p>
                <p><strong>Items:</strong> {deliveryData.items.length}</p>
                <p><strong>Current Status:</strong> 
                  <span className="ms-2 badge bg-info text-dark">{deliveryData.status}</span>
                </p>
              </div>
            </div>
            
            <div className="table-responsive mb-4">
              <h6>Order Items</h6>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryData.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="card mb-3">
              <div className="card-header bg-light">
                <h6 className="mb-0">Update Delivery Status</h6>
              </div>
              <div className="card-body d-flex flex-wrap gap-2">
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => handleStatusUpdate('picked-up')}
                >
                  <i className="bi bi-box me-1"></i>
                  Picked Up
                </button>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => handleStatusUpdate('out-for-delivery')}
                >
                  <i className="bi bi-truck me-1"></i>
                  Out for Delivery
                </button>
                <button 
                  className="btn btn-success"
                  onClick={() => handleStatusUpdate('delivered')}
                >
                  <i className="bi bi-check-circle me-1"></i>
                  Delivered
                </button>
                <button 
                  className="btn btn-outline-danger"
                  onClick={() => handleStatusUpdate('failed-delivery')}
                >
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Failed Delivery
                </button>
              </div>
            </div>
            
            <button 
              className="btn btn-warning"
              onClick={() => navigate('/delivery/issue-report', { state: { deliveryId: deliveryData.id } })}
            >
              <i className="bi bi-flag me-1"></i>
              Report Issue
            </button>
          </div>
        </div>
      ) : scanning ? (
        <div className="card">
          <div className="card-body">
            <QRScanner
              onScan={handleScan}
              onError={handleError}
              onClose={handleClose}
              facingMode="environment"
              delay={300}
            />
            <div className="text-center mt-3">
              <button className="btn btn-outline-secondary" onClick={handleClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center">
            <i className="bi bi-qr-code-scan" style={{ fontSize: '3rem' }}></i>
            <h5 className="mt-3">Scan Package QR Code</h5>
            <p>Scan the QR code on the package to access delivery details and update status</p>
            <button className="btn btn-primary btn-lg" onClick={startScanner}>
              <i className="bi bi-camera me-2"></i>
              Start Scanner
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default DeliveryScan;
