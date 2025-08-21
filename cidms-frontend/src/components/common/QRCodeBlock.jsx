import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

const QRCodeBlock = ({ value, size = 128, level = 'M', includeMargin = true, title, description, downloadable = false }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadQRCode = async () => {
    if (!downloadable || !value) return;

    setIsDownloading(true);
    try {
      // Create a canvas element to convert SVG to image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size with margin
      const canvasSize = size + (includeMargin ? 40 : 0);
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      
      // Create SVG string
      const svgString = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" fill="white"/>
          ${document.querySelector(`#qr-${value.replace(/[^a-zA-Z0-9]/g, '')}`).innerHTML}
        </svg>
      `;
      
      // Create blob and download
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-code-${title || 'download'}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download QR code:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      // You might want to show a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (!value) {
    return (
      <div className="qr-code-block text-center p-4">
        <div 
          className="d-flex align-items-center justify-content-center bg-light border rounded"
          style={{ width: size, height: size, margin: '0 auto' }}
        >
          <div className="text-muted">
            <i className="bi bi-qr-code fs-1 mb-2 d-block"></i>
            <small>No QR Code</small>
          </div>
        </div>
        {title && <h6 className="mt-3 mb-1">{title}</h6>}
        {description && <p className="text-muted small mb-0">{description}</p>}
      </div>
    );
  }

  return (
    <div className="qr-code-block text-center">
      <div className="position-relative d-inline-block">
        <div 
          id={`qr-${value.replace(/[^a-zA-Z0-9]/g, '')}`}
          className="p-3 bg-white border rounded shadow-sm"
          style={{ display: 'inline-block' }}
        >
          <QRCodeSVG
            value={value}
            size={size}
            level={level}
            includeMargin={includeMargin}
            imageSettings={{
              src: "/logo.png", // Optional: Add your logo
              height: size * 0.15,
              width: size * 0.15,
              excavate: true,
            }}
          />
        </div>
        
        {/* Action buttons overlay */}
        <div className="position-absolute top-0 end-0 mt-1 me-1">
          <div className="btn-group-vertical btn-group-sm">
            {downloadable && (
              <button
                className="btn btn-light btn-sm border"
                onClick={downloadQRCode}
                disabled={isDownloading}
                title="Download QR Code"
              >
                {isDownloading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <i className="bi bi-download"></i>
                )}
              </button>
            )}
            <button
              className="btn btn-light btn-sm border"
              onClick={copyToClipboard}
              title="Copy QR Code Value"
            >
              <i className="bi bi-clipboard"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Title and description */}
      {(title || description) && (
        <div className="mt-3">
          {title && <h6 className="mb-1">{title}</h6>}
          {description && <p className="text-muted small mb-0">{description}</p>}
        </div>
      )}

      {/* QR Code value display */}
      <div className="mt-2">
        <small className="text-muted d-block">QR Code Value:</small>
        <code className="small bg-light p-1 rounded border d-inline-block text-break" style={{ maxWidth: '200px' }}>
          {value.length > 30 ? `${value.substring(0, 30)}...` : value}
        </code>
      </div>

      {/* Additional info */}
      <div className="mt-2">
        <div className="d-flex justify-content-center gap-3 small text-muted">
          <span>
            <i className="bi bi-shield-check me-1"></i>
            Error Level: {level}
          </span>
          <span>
            <i className="bi bi-aspect-ratio me-1"></i>
            {size}×{size}px
          </span>
        </div>
      </div>
    </div>
  );
};

export default QRCodeBlock;
