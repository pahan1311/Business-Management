import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

const QRScanner = ({ onScan, onClose, onError }) => {
  const videoRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [reader, setReader] = useState(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    setReader(codeReader);

    const startScanning = async () => {
      try {
        setIsScanning(true);
        setError(null);

        // Get video input devices
        const videoInputDevices = await codeReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          throw new Error('No camera devices found');
        }

        // Use the first available camera (usually back camera on mobile)
        const selectedDeviceId = videoInputDevices[0].deviceId;

        // Start decoding from video device
        await codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
          if (result) {
            setIsScanning(false);
            onScan(result.getText());
          }
          if (err && !(err instanceof Error)) {
            // Ignore common decoding errors, only handle actual errors
            console.debug('QR scanning:', err);
          }
        });

      } catch (err) {
        console.error('QR Scanner Error:', err);
        setError(err.message || 'Failed to start camera');
        setIsScanning(false);
        if (onError) onError(err);
      }
    };

    startScanning();

    // Cleanup function
    return () => {
      if (codeReader) {
        codeReader.reset();
      }
    };
  }, [onScan, onError]);

  const handleClose = () => {
    if (reader) {
      reader.reset();
    }
    setIsScanning(false);
    onClose();
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-qr-code-scan me-2"></i>
              QR Code Scanner
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
            ></button>
          </div>

          <div className="modal-body">
            {error ? (
              <div className="alert alert-danger d-flex align-items-center">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <div>
                  <strong>Camera Error:</strong> {error}
                  <br />
                  <small>Please check camera permissions and try again.</small>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="position-relative d-inline-block">
                  <video
                    ref={videoRef}
                    className="img-fluid rounded"
                    style={{ 
                      maxWidth: '100%', 
                      height: '400px',
                      objectFit: 'cover',
                      backgroundColor: '#000'
                    }}
                    playsInline
                    muted
                  />
                  
                  {/* Scanning overlay */}
                  <div className="position-absolute top-50 start-50 translate-middle">
                    <div 
                      className="border border-primary border-2 rounded"
                      style={{
                        width: '200px',
                        height: '200px',
                        backgroundColor: 'rgba(0,123,255,0.1)',
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-center h-100">
                        {isScanning ? (
                          <div className="text-white text-center">
                            <div className="spinner-border text-primary mb-2" role="status">
                              <span className="visually-hidden">Scanning...</span>
                            </div>
                            <div className="small">Scanning for QR code...</div>
                          </div>
                        ) : (
                          <div className="text-white text-center">
                            <i className="bi bi-qr-code fs-1 mb-2"></i>
                            <div className="small">Position QR code here</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="alert alert-info small mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    Position the QR code within the blue frame. Make sure there's good lighting and hold steady.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
            >
              <i className="bi bi-x-circle me-2"></i>
              Close Scanner
            </button>
            {error && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
