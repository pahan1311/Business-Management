import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import FileUploader from './FileUploader';

const QRScanner = ({ 
  mode = 'view',
  onDetected = () => {},
  onError = () => {},
  cameraFacingMode = 'environment',
  className = ""
}) => {
  const videoRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState('');
  const [useFileUpload, setUseFileUpload] = useState(false);
  const [detectedCodes, setDetectedCodes] = useState(new Set());
  const codeReader = useRef(new BrowserQRCodeReader());
  const controlsRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      setIsScanning(true);
      
      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      // Find the back camera if available
      let selectedDeviceId = videoInputDevices[0].deviceId;
      if (cameraFacingMode === 'environment') {
        const backCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        if (backCamera) {
          selectedDeviceId = backCamera.deviceId;
        }
      }

      const controls = await codeReader.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const code = result.getText();
            
            // Debounce repeated scans of the same code
            if (!detectedCodes.has(code)) {
              setDetectedCodes(prev => new Set([...prev, code]));
              
              // Haptic feedback if available
              if (navigator.vibrate) {
                navigator.vibrate(200);
              }
              
              // Sound feedback (optional)
              try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQeATWAy+/Iaj');
                audio.play().catch(() => {});
              } catch (e) {}
              
              onDetected(code);
            }
          }
          
          if (error && !(error instanceof Error)) {
            // Ignore common scanning errors that aren't actual errors
          }
        }
      );

      controlsRef.current = controls;
      setHasPermission(true);
      
    } catch (err) {
      console.error('QR Scanner Error:', err);
      setError(err.message || 'Failed to start camera');
      setHasPermission(false);
      setIsScanning(false);
      onError(err);
    }
  };

  const stopScanning = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setIsScanning(false);
    setDetectedCodes(new Set());
  };

  const handleFileUpload = async (file) => {
    try {
      setError('');
      const result = await codeReader.current.decodeFromImageElement(
        await createImageElement(file)
      );
      
      if (result) {
        onDetected(result.getText());
      }
    } catch (err) {
      setError('No QR code found in the uploaded image');
      onError(err);
    }
  };

  const createImageElement = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = URL.createObjectURL(file);
    });
  };

  const getModeConfig = (mode) => {
    const configs = {
      pickup: {
        title: 'Scan for Pickup',
        instruction: 'Scan the order QR code to confirm pickup',
        color: 'primary'
      },
      delivery: {
        title: 'Scan for Delivery',
        instruction: 'Scan the order QR code to confirm delivery',
        color: 'success'
      },
      view: {
        title: 'Scan QR Code',
        instruction: 'Position the QR code within the frame',
        color: 'info'
      }
    };
    return configs[mode] || configs.view;
  };

  const config = getModeConfig(mode);

  if (useFileUpload) {
    return (
      <div className={`qr-scanner ${className}`}>
        <div className="card">
          <div className="card-header text-center">
            <h5 className="mb-0">{config.title}</h5>
          </div>
          <div className="card-body">
            <FileUploader
              accept="image/*"
              onFileSelect={handleFileUpload}
            />
            <div className="text-center mt-3">
              <button
                className="btn btn-outline-primary"
                onClick={() => setUseFileUpload(false)}
              >
                <i className="bi bi-camera me-2"></i>
                Use Camera Instead
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="alert alert-danger mt-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`qr-scanner ${className}`}>
      <div className="card">
        <div className="card-header text-center">
          <h5 className="mb-0">{config.title}</h5>
          <p className="text-muted mb-0 small">{config.instruction}</p>
        </div>
        
        <div className="card-body p-0">
          {!isScanning && hasPermission !== true && (
            <div className="text-center p-4">
              <i className={`bi bi-qr-code-scan text-${config.color}`} style={{ fontSize: '3rem' }}></i>
              <div className="mt-3">
                {hasPermission === false ? (
                  <div>
                    <p className="text-danger mb-3">Camera access denied</p>
                    <button
                      className="btn btn-outline-primary me-2"
                      onClick={startScanning}
                    >
                      <i className="bi bi-camera me-2"></i>
                      Try Again
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setUseFileUpload(true)}
                    >
                      <i className="bi bi-upload me-2"></i>
                      Upload Image
                    </button>
                  </div>
                ) : (
                  <button
                    className={`btn btn-${config.color}`}
                    onClick={startScanning}
                  >
                    <i className="bi bi-camera me-2"></i>
                    Start Scanner
                  </button>
                )}
              </div>
            </div>
          )}

          {isScanning && (
            <div className="qr-scanner-container position-relative">
              <video
                ref={videoRef}
                className="w-100"
                style={{ maxHeight: '400px', objectFit: 'cover' }}
                autoPlay
                muted
                playsInline
              />
              <div className="qr-scanner-overlay"></div>
              
              <div className="position-absolute top-0 end-0 p-2">
                <button
                  className="btn btn-dark btn-sm"
                  onClick={stopScanning}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              
              <div className="position-absolute bottom-0 start-0 end-0 p-3 bg-dark bg-opacity-50">
                <p className="text-white text-center mb-0 small">
                  Position the QR code within the frame
                </p>
              </div>
            </div>
          )}
        </div>
        
        {isScanning && (
          <div className="card-footer text-center">
            <button
              className="btn btn-outline-secondary me-2"
              onClick={stopScanning}
            >
              Stop Scanning
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={() => {
                stopScanning();
                setUseFileUpload(true);
              }}
            >
              <i className="bi bi-upload me-2"></i>
              Upload Image Instead
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="alert alert-danger mt-3">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}
    </div>
  );
};

export default QRScanner;
