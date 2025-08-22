import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../../../components/common/QRScanner';
import LoadingBlock from '../../../components/common/LoadingBlock';
import toast from '../../../utils/toast';

const CustomerScan = () => {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const startScanner = () => {
    setScanning(true);
  };

  const handleScan = async (data) => {
    if (data) {
      setScanning(false);
      setLoading(true);
      try {
        // Expecting QR data in format: order_id:XXXX
        const orderId = data.split(':')[1];
        if (!orderId) throw new Error('Invalid QR code format');
        
        // Navigate to order details page with the scanned ID
        toast.success('Order found! Loading details...');
        setTimeout(() => {
          setLoading(false);
          navigate(`/customer/orders/${orderId}`);
        }, 1000);
      } catch (error) {
        toast.error('Error scanning QR code: ' + error.message);
        setLoading(false);
      }
    }
  };

  const handleError = (error) => {
    toast.error('QR Scanner error: ' + error.message);
    setScanning(false);
  };

  const handleClose = () => {
    setScanning(false);
  };

  return (
    <div className="customer-scan-page">
      <h1>Track Order</h1>
      
      {loading ? (
        <LoadingBlock text="Processing QR code..." />
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
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center">
            <i className="bi bi-qr-code-scan" style={{ fontSize: '3rem' }}></i>
            <h5 className="mt-3">Scan QR Code to Track</h5>
            <p>Scan the QR code on your order receipt to track your delivery in real-time.</p>
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
export default CustomerScan;
