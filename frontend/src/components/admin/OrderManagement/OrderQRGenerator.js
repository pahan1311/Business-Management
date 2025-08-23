import React, { useState, useCallback } from 'react';
import { Modal, Button, Card, Row, Col, Alert, ProgressBar, ListGroup, Spinner } from 'react-bootstrap';
import OrderQRService from '../../../services/orderQRService';

const OrderQRGenerator = ({ order, show, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const orderQRService = new OrderQRService();
  const [steps, setSteps] = useState(orderQRService.getProcessingSteps());

  const updateStepStatus = useCallback((stepId, status) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    );
    if (status === 'completed') {
      setCurrentStep(stepId);
    }
  }, []);

  const generateQRCode = async () => {
    if (!order) return;

    try {
      setLoading(true);
      setError('');
      setResult(null);
      setCurrentStep(0);
      setSteps(orderQRService.getProcessingSteps());

      // Step 1: Validate
      updateStepStatus(1, 'processing');
      const validationErrors = orderQRService.validateOrderData(order);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }
      updateStepStatus(1, 'completed');

      // Step 2-6: Generate complete QR system
      updateStepStatus(2, 'processing');
      const qrResult = await orderQRService.generateCompleteOrderQR(order, {
        additionalInfo: {
          companyName: 'Business Management System'
        },
        qrSize: 300,
        qrMargin: 4
      });

      // Update all remaining steps as completed
      for (let i = 2; i <= 6; i++) {
        updateStepStatus(i, 'completed');
      }

      setResult(qrResult);

    } catch (error) {
      console.error('Error generating QR code:', error);
      setError(error.message || 'Failed to generate QR code');
      
      // Mark current step as failed
      if (currentStep > 0) {
        updateStepStatus(currentStep + 1, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!result?.qrCode?.downloadableQR) return;
    
    const fileName = `QR_Order_${order.orderNumber || order._id}_${Date.now()}.png`;
    orderQRService.downloadQRCode(result.qrCode.downloadableQR, fileName);
  };

  const downloadPDF = () => {
    if (!result?.pdfInfo?.shareableLink) return;
    
    // Open Google Drive link in new tab
    window.open(result.pdfInfo.shareableLink, '_blank');
  };

  const handleClose = () => {
    setResult(null);
    setError('');
    setCurrentStep(0);
    setSteps(orderQRService.getProcessingSteps());
    onClose();
  };

  const getStepIcon = (step) => {
    switch (step.status) {
      case 'completed':
        return <i className="bi bi-check-circle-fill text-success"></i>;
      case 'processing':
        return <Spinner animation="border" size="sm" className="text-primary" />;
      case 'error':
        return <i className="bi bi-x-circle-fill text-danger"></i>;
      default:
        return <i className="bi bi-circle text-muted"></i>;
    }
  };

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return (completedSteps / steps.length) * 100;
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-qr-code me-2"></i>
          Generate Order QR Code
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {order && (
          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">Order Information</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>Order #:</strong> {order.orderNumber || 'N/A'}</p>
                  <p><strong>Customer:</strong> {order.customer?.name || 'N/A'}</p>
                  <p><strong>Status:</strong> <span className="badge bg-info">{order.status}</span></p>
                </Col>
                <Col md={6}>
                  <p><strong>Total:</strong> ${order.totalAmount?.toFixed(2) || '0.00'}</p>
                  <p><strong>Items:</strong> {order.items?.length || 0}</p>
                  <p><strong>Date:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {error && (
          <Alert variant="danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {loading && (
          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">Processing Steps</h6>
            </Card.Header>
            <Card.Body>
              <ProgressBar 
                animated 
                now={getProgressPercentage()} 
                className="mb-3"
                variant={error ? 'danger' : 'primary'}
              />
              <ListGroup variant="flush">
                {steps.map((step) => (
                  <ListGroup.Item 
                    key={step.id} 
                    className="d-flex justify-content-between align-items-center"
                  >
                    <span className={step.status === 'processing' ? 'fw-bold' : ''}>
                      {step.name}
                    </span>
                    {getStepIcon(step)}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        )}

        {result && (
          <Card>
            <Card.Header className="bg-success text-white">
              <h6 className="mb-0">
                <i className="bi bi-check-circle me-2"></i>
                QR Code Generated Successfully!
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="text-center mb-3">
                    <img 
                      src={result.qrCode.downloadableQR} 
                      alt="Generated QR Code"
                      style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                  </div>
                </Col>
                <Col md={6}>
                  <h6>QR Code Details:</h6>
                  <p><strong>Target:</strong> Order Details PDF</p>
                  <p><strong>Storage:</strong> Google Drive</p>
                  <p><strong>Access:</strong> Public (via link)</p>
                  <p><strong>Generated:</strong> {new Date().toLocaleString()}</p>
                  
                  <hr />
                  
                  <h6>PDF Information:</h6>
                  <p><strong>File Name:</strong> {result.pdfInfo.fileName}</p>
                  <p><strong>File ID:</strong> {result.pdfInfo.fileId}</p>
                  
                  <Alert variant="info" className="small">
                    <i className="bi bi-info-circle me-1"></i>
                    Scanning this QR code will open the complete order details PDF stored in Google Drive.
                  </Alert>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <div>
            {!result && !loading && (
              <Button variant="primary" onClick={generateQRCode} disabled={!order}>
                <i className="bi bi-qr-code me-2"></i>
                Generate QR Code
              </Button>
            )}
          </div>
          <div>
            {result && (
              <>
                <Button variant="success" onClick={downloadQRCode} className="me-2">
                  <i className="bi bi-download me-2"></i>
                  Download QR Code
                </Button>
                <Button variant="outline-primary" onClick={downloadPDF} className="me-2">
                  <i className="bi bi-file-earmark-pdf me-2"></i>
                  View PDF
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={handleClose}>
              {loading ? 'Cancel' : 'Close'}
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default OrderQRGenerator;
