import { useState } from 'react';
import QRCode from 'qrcode.react';

const QRCodeBlock = ({ 
  imageUrl,
  token,
  onRefresh = () => {},
  showDownload = true,
  showPrint = true,
  size = 200,
  className = ""
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    
    try {
      await onRefresh();
    } catch (err) {
      setError('Failed to refresh QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (imageUrl) {
      // Download from backend URL
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `qr-code-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (token) {
      // Generate download from React component
      const canvas = document.getElementById('qr-code-canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `qr-code-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const qrContent = imageUrl ? 
      `<img src="${imageUrl}" style="max-width: 100%; height: auto;" />` :
      document.getElementById('qr-code-container')?.innerHTML || '';

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh;
              font-family: Arial, sans-serif;
            }
            .print-container {
              text-align: center;
            }
            .qr-info {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${qrContent}
            <div class="qr-info">
              <p>Scan this QR code to track your order</p>
              <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const displayValue = token || imageUrl;

  if (!displayValue) {
    return (
      <div className={`qr-code-block ${className}`}>
        <div className="card">
          <div className="card-body text-center">
            <i className="bi bi-qr-code text-muted" style={{ fontSize: '3rem' }}></i>
            <p className="text-muted mt-2 mb-0">No QR code available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`qr-code-block ${className}`}>
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h6 className="mb-0">QR Code</h6>
          <div className="btn-group btn-group-sm">
            {onRefresh && (
              <button
                className="btn btn-outline-secondary"
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh QR Code"
              >
                <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
              </button>
            )}
            {showDownload && (
              <button
                className="btn btn-outline-primary"
                onClick={handleDownload}
                title="Download QR Code"
              >
                <i className="bi bi-download"></i>
              </button>
            )}
            {showPrint && (
              <button
                className="btn btn-outline-success"
                onClick={handlePrint}
                title="Print QR Code"
              >
                <i className="bi bi-printer"></i>
              </button>
            )}
          </div>
        </div>
        
        <div className="card-body text-center">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: `${size}px` }}>
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Generating...</span>
              </div>
            </div>
          ) : imageUrl ? (
            <div id="qr-code-container">
              <img 
                src={imageUrl} 
                alt="QR Code" 
                className="img-fluid"
                style={{ maxWidth: `${size}px`, height: 'auto' }}
                onError={() => setError('Failed to load QR code image')}
              />
            </div>
          ) : token ? (
            <div id="qr-code-container">
              <QRCode
                id="qr-code-canvas"
                value={token}
                size={size}
                level="M"
                includeMargin={true}
                renderAs="canvas"
              />
            </div>
          ) : null}
          
          {error && (
            <div className="alert alert-danger mt-3 mb-0">
              <small>{error}</small>
            </div>
          )}
          
          <div className="mt-3">
            <small className="text-muted">
              Scan to track order status
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeBlock;
