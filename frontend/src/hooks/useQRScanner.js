import { useState, useEffect, useRef } from 'react';
import qrCodeService from '../services/qrCodeService';

export const useQRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [hasCamera, setHasCamera] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Check if camera is available
    qrCodeService.constructor.hasCamera().then(setHasCamera);

    // Cleanup on unmount
    return () => {
      if (isScanning) {
        stopScanning();
      }
    };
  }, [isScanning]);

  const startScanning = async () => {
    if (!videoRef.current) {
      setError('Video element not found');
      return false;
    }

    setError(null);
    setScanResult(null);
    setIsScanning(true);

    const success = await qrCodeService.startScanning(
      videoRef.current,
      (result) => {
        setScanResult(result);
        setIsScanning(false);
      },
      (err) => {
        setError(err.message || 'Scanning error');
      }
    );

    if (!success) {
      setIsScanning(false);
    }

    return success;
  };

  const stopScanning = () => {
    qrCodeService.stopScanning();
    setIsScanning(false);
    setError(null);
  };

  const resetScan = () => {
    setScanResult(null);
    setError(null);
  };

  return {
    videoRef,
    isScanning,
    scanResult,
    error,
    hasCamera,
    startScanning,
    stopScanning,
    resetScan
  };
};
