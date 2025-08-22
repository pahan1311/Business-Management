import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { apiService } from '../../../services/api';

const QRScanner = ({ onScanSuccess, onScanError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanner, setScanner] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    getCameras();
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  const getCameras = async () => {
    try {
      const devices = await Html5QrcodeScanner.getCameras();
      setCameras(devices);
      if (devices.length > 0) {
        setSelectedCamera(devices[0].id);
      }
    } catch (error) {
      console.error('Failed to get cameras:', error);
      setCameraPermission(false);
    }
  };

  const startScanning = async () => {
    try {
      setCameraPermission(true);
      setIsScanning(true);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      const html5QrCodeScanner = new Html5QrcodeScanner(
        "qr-scanner-container",
        config,
        false
      );

      html5QrCodeScanner.render(
        (decodedText, decodedResult) => {
          handleScanSuccess(decodedText, decodedResult);
          stopScanning();
        },
        (error) => {
          // Handle scan error silently - scanning errors are common
          console.debug('Scan error:', error);
        }
      );

      setScanner(html5QrCodeScanner);
    } catch (error) {
      console.error('Failed to start scanning:', error);
      setCameraPermission(false);
      setIsScanning(false);
      if (onScanError) {
        onScanError('Failed to access camera. Please check permissions.');
      }
    }
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setIsScanning(false);
  };

  const handleScanSuccess = async (decodedText, decodedResult) => {
    console.log('QR Code scanned:', decodedText);
    
    try {
      // Process the scanned QR code
      const processedData = await processQRCode(decodedText);
      
      if (onScanSuccess) {
        onScanSuccess(processedData);
      }
    } catch (error) {
      console.error('Failed to process QR code:', error);
      if (onScanError) {
        onScanError('Failed to process QR code: ' + error.message);
      }
    }
  };

  const processQRCode = async (qrData) => {
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(qrData);
      if (parsed.orderId || parsed.deliveryId) {
        return {
          type: 'order',
          data: parsed
        };
      }
    } catch (e) {
      // Not JSON, try other formats
    }

    // Check if it's a URL
    if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
      return {
        type: 'url',
        data: { url: qrData }
      };
    }

    // Check if it looks like an order number
    if (/^(ORD|DEL|PKG)-\d+$/i.test(qrData)) {
      return {
        type: 'identifier',
        data: { id: qrData.toUpperCase() }
      };
    }

    // Try to fetch order/delivery info from API
    try {
      const response = await apiService.get(`/qr-code/lookup/${encodeURIComponent(qrData)}`);
      return {
        type: 'lookup',
        data: response.data
      };
    } catch (error) {
      // Return raw data if nothing else works
      return {
        type: 'raw',
        data: { raw: qrData }
      };
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleScanSuccess(manualInput.trim(), null);
      setManualInput('');
      setShowManualInput(false);
    }
  };

  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission(true);
      getCameras();
    } catch (error) {
      console.error('Camera permission denied:', error);
      setCameraPermission(false);
    }
  };

  return (
    <div className="qr-scanner-container">
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-qr-code-scan me-2"></i>
              QR Code Scanner
            </h5>
            <div className="btn-group">
              <button
                className={`btn btn-sm ${!showManualInput ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setShowManualInput(false)}
              >
                <i className="bi bi-camera me-1"></i>
                Camera
              </button>
              <button
                className={`btn btn-sm ${showManualInput ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setShowManualInput(true)}
              >
                <i className="bi bi-keyboard me-1"></i>
                Manual
              </button>
            </div>
          </div>
        </div>

        <div className="card-body">
          {!showManualInput ? (
            // Camera Scanner
            <div>
              {cameraPermission === null ? (
                <div className="text-center py-4">
                  <button
                    className="btn btn-primary"
                    onClick={requestCameraPermission}
                  >
                    <i className="bi bi-camera me-2"></i>
                    Enable Camera
                  </button>
                </div>
              ) : cameraPermission === false ? (
                <div className="text-center py-4">
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Camera permission is required to scan QR codes. 
                    Please enable camera access in your browser settings.
                  </div>
                  <button
                    className="btn btn-outline-primary"
                    onClick={requestCameraPermission}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Try Again
                  </button>
                </div>
              ) : !isScanning ? (
                <div className="text-center py-4">
                  {cameras.length > 0 && (
                    <div className="mb-3">
                      <label htmlFor="cameraSelect" className="form-label">Select Camera:</label>
                      <select
                        id="cameraSelect"
                        className="form-select form-select-sm d-inline-block w-auto mx-auto"
                        value={selectedCamera}
                        onChange={(e) => setSelectedCamera(e.target.value)}
                      >
                        {cameras.map(camera => (
                          <option key={camera.id} value={camera.id}>
                            {camera.label || `Camera ${camera.id.substr(-4)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button
                    className="btn btn-success btn-lg"
                    onClick={startScanning}
                  >
                    <i className="bi bi-camera me-2"></i>
                    Start Scanning
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-center mb-3">
                    <div className="alert alert-info">
                      <i className="bi bi-camera me-2"></i>
                      Point your camera at the QR code to scan it
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-center mb-3">
                    <div 
                      id="qr-scanner-container" 
                      ref={scannerRef}
                      style={{ width: '100%', maxWidth: '400px' }}
                    ></div>
                  </div>

                  <div className="text-center">
                    <button
                      className="btn btn-danger"
                      onClick={stopScanning}
                    >
                      <i className="bi bi-stop-fill me-2"></i>
                      Stop Scanning
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Manual Input
            <div className="text-center py-4">
              <form onSubmit={handleManualSubmit}>
                <div className="mb-3">
                  <label htmlFor="manualInput" className="form-label">
                    Enter QR Code Data Manually:
                  </label>
                  <input
                    type="text"
                    id="manualInput"
                    className="form-control"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter order number, delivery ID, or QR code data..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!manualInput.trim()}
                >
                  <i className="bi bi-check-lg me-2"></i>
                  Process
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="card-footer">
          <div className="row text-center">
            <div className="col-4">
              <div className="text-muted small">
                <i className="bi bi-qr-code display-6 d-block mb-2"></i>
                Scan QR codes on orders and packages
              </div>
            </div>
            <div className="col-4">
              <div className="text-muted small">
                <i className="bi bi-shield-check display-6 d-block mb-2"></i>
                Verify delivery information
              </div>
            </div>
            <div className="col-4">
              <div className="text-muted small">
                <i className="bi bi-lightning display-6 d-block mb-2"></i>
                Quick status updates
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scanner Tips */}
      <div className="card mt-3">
        <div className="card-header">
          <h6 className="mb-0">
            <i className="bi bi-lightbulb me-2"></i>
            Scanning Tips
          </h6>
        </div>
        <div className="card-body">
          <ul className="list-unstyled mb-0">
            <li className="mb-2">
              <i className="bi bi-check-circle text-success me-2"></i>
              Hold your device steady and keep the QR code within the frame
            </li>
            <li className="mb-2">
              <i className="bi bi-check-circle text-success me-2"></i>
              Ensure good lighting - avoid shadows and glare
            </li>
            <li className="mb-2">
              <i className="bi bi-check-circle text-success me-2"></i>
              Keep an appropriate distance - not too close or too far
            </li>
            <li className="mb-0">
              <i className="bi bi-check-circle text-success me-2"></i>
              Clean your camera lens if the scan isn't working
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
