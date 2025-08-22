import { useState, useRef } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { useSnackbar } from 'notistack';

const QRCodeModal = ({ open, order, onClose }) => {
  const [qrCodeUrl, setQRCodeUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const qrCardRef = useRef(null);
  const { enqueueSnackbar } = useSnackbar();

  const generateQRCode = async () => {
    if (!order) return;

    setIsGenerating(true);
    try {
      // Create comprehensive QR data with delivery and order details
      const qrData = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customer: {
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone,
          address: order.deliveryAddress || order.customer?.address
        },
        delivery: {
          partnerId: order.deliveryPartnerId,
          partnerName: order.deliveryPartner?.name,
          expectedDate: order.expectedDeliveryDate,
          instructions: order.deliveryInstructions
        },
        order: {
          items: order.items?.map(item => ({
            name: item.productName || item.product?.name,
            quantity: item.quantity,
            price: item.unitPrice
          })) || [],
          totalAmount: order.totalAmount,
          totalItems: order.totalItems,
          status: order.status,
          orderDate: order.orderDate,
          notes: order.notes
        },
        timestamp: new Date().toISOString(),
        type: 'DELIVERY_ORDER'
      };

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQRCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      enqueueSnackbar('Failed to generate QR code', { variant: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCard = async () => {
    if (!qrCardRef.current) return;

    try {
      const canvas = await html2canvas(qrCardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `order-${order.orderNumber}-qr.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      enqueueSnackbar('QR card downloaded successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error downloading QR card:', error);
      enqueueSnackbar('Failed to download QR card', { variant: 'error' });
    }
  };

  const printQRCard = () => {
    if (!qrCardRef.current) return;

    const printWindow = window.open('', '_blank');
    const cardHtml = qrCardRef.current.outerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Order ${order?.orderNumber} - QR Code</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
          <style>
            body { margin: 20px; font-family: Arial, sans-serif; }
            .qr-card { max-width: 400px; margin: 0 auto; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${cardHtml}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  // Generate QR code when modal opens
  useState(() => {
    if (open && order && !qrCodeUrl) {
      generateQRCode();
    }
  }, [open, order]);

  if (!order || !open) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-qr-code me-2"></i>
              QR Code - Order #{order.orderNumber}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          
          <div className="modal-body">
            {isGenerating ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Generating QR code...</span>
                </div>
                <p className="mt-3">Generating QR code...</p>
              </div>
            ) : qrCodeUrl ? (
              <div ref={qrCardRef} className="qr-card border rounded p-4 bg-white">
                {/* Header */}
                <div className="text-center border-bottom pb-3 mb-4">
                  <h5 className="mb-1">Delivery Order QR Code</h5>
                  <p className="text-muted mb-0">Order #{order.orderNumber}</p>
            </div>

            <div className="row">
              <div className="col-md-6">
                {/* QR Code */}
                <div className="text-center">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    className="border rounded p-2"
                    style={{ maxWidth: '200px', width: '100%' }}
                  />
                  <p className="small text-muted mt-2">
                    Scan for delivery details
                  </p>
                </div>
              </div>
              
              <div className="col-md-6">
                {/* Order Details */}
                <div className="mb-3">
                  <h6 className="text-primary">Customer Details</h6>
                  <p className="mb-1"><strong>{order.customerName}</strong></p>
                  <p className="mb-1 small">{order.customerEmail}</p>
                  {order.customerPhone && (
                    <p className="mb-1 small">{order.customerPhone}</p>
                  )}
                </div>

                <div className="mb-3">
                  <h6 className="text-primary">Delivery Address</h6>
                  <p className="small mb-0">
                    {order.deliveryAddress || order.customer?.address || 'Address not specified'}
                  </p>
                </div>

                <div className="mb-3">
                  <h6 className="text-primary">Order Summary</h6>
                  <p className="mb-1 small">Items: {order.totalItems}</p>
                  <p className="mb-1 small">Total: ${order.totalAmount?.toFixed(2)}</p>
                  <p className="mb-0 small">Status: {order.status?.replace('_', ' ')}</p>
                </div>

                {order.deliveryPartner && (
                  <div className="mb-3">
                    <h6 className="text-primary">Delivery Partner</h6>
                    <p className="mb-0 small">{order.deliveryPartner.name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-top pt-3 mt-4 text-center">
              <small className="text-muted">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </small>
            </div>
          </div>
        ) : (
          <div className="text-center py-5">
            <i className="bi bi-exclamation-triangle text-warning fs-1"></i>
            <p className="mt-3">Failed to generate QR code</p>
            <button className="btn btn-primary" onClick={generateQRCode}>
              Try Again
            </button>
          </div>
        )}
      </div>
      
      <div className="modal-footer">
        <button className="btn btn-outline-secondary" onClick={onClose}>
          Close
        </button>
        {qrCodeUrl && (
          <>
            <button className="btn btn-outline-primary" onClick={downloadQRCard}>
              <i className="bi bi-download me-2"></i>
              Download
            </button>
            <button className="btn btn-primary" onClick={printQRCard}>
              <i className="bi bi-printer me-2"></i>
              Print
            </button>
          </>
        )}
      </div>
    </div>
    </div>
    </div>
  );
};

export default QRCodeModal;
