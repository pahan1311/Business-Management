import QrScanner from 'qr-scanner';
import QRCode from 'qrcode';

class QRCodeService {
  constructor() {
    this.scanner = null;
  }

  // Start QR code scanning
  async startScanning(videoElement, onScanSuccess, onScanError) {
    try {
      this.scanner = new QrScanner(
        videoElement,
        result => onScanSuccess(result.data),
        {
          onDecodeError: onScanError,
          highlightScanRegion: true,
          highlightCodeOutline: true
        }
      );
      
      await this.scanner.start();
      return true;
    } catch (error) {
      console.error('Failed to start QR scanner:', error);
      if (onScanError) onScanError(error);
      return false;
    }
  }

  // Stop QR code scanning
  stopScanning() {
    if (this.scanner) {
      this.scanner.stop();
      this.scanner.destroy();
      this.scanner = null;
    }
  }

  // Generate QR code as data URL
  async generateQRCode(data, options = {}) {
    try {
      const defaultOptions = {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      };
      
      const qrOptions = { ...defaultOptions, ...options };
      const qrDataURL = await QRCode.toDataURL(data, qrOptions);
      return qrDataURL;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw error;
    }
  }

  // Generate QR code as SVG
  async generateQRCodeSVG(data, options = {}) {
    try {
      const defaultOptions = {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      };
      
      const qrOptions = { ...defaultOptions, ...options };
      const qrSVG = await QRCode.toString(data, { type: 'svg', ...qrOptions });
      return qrSVG;
    } catch (error) {
      console.error('Failed to generate QR code SVG:', error);
      throw error;
    }
  }

  // Check if browser supports QR scanning
  static async hasCamera() {
    try {
      return await QrScanner.hasCamera();
    } catch (error) {
      console.error('Failed to check camera availability:', error);
      return false;
    }
  }

  // List available cameras
  static async listCameras() {
    try {
      return await QrScanner.listCameras(true);
    } catch (error) {
      console.error('Failed to list cameras:', error);
      return [];
    }
  }
}

export default new QRCodeService();
