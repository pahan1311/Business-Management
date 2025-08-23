import React from 'react';
import { Modal, Button, Image, Alert, Row, Col } from 'react-bootstrap';

const PDFQRModal = ({ show, onClose, qrCodeData, pdfData, onDownloadQR }) => {
  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-qr-code me-2"></i>
          PDF Report & QR Code
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="success" className="mb-4">
          <i className="bi bi-check-circle me-2"></i>
          <strong>Success!</strong> PDF report generated and uploaded to Google Drive.
        </Alert>
        
        <Row>
          <Col md={6} className="text-center mb-4">
            <h5 className="mb-3">QR Code</h5>
            {qrCodeData ? (
              <div className="border p-3 rounded bg-light">
                <Image 
                  src={qrCodeData} 
                  alt="QR Code for PDF" 
                  className="img-fluid mb-3" 
                  style={{ maxWidth: '100%', height: 'auto' }} 
                />
                <p className="mb-0 text-muted small">
                  <i className="bi bi-info-circle me-1"></i>
                  Scan to access the PDF report
                </p>
              </div>
            ) : (
              <div className="d-flex justify-content-center my-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
          </Col>
          
          <Col md={6}>
            <h5 className="mb-3">PDF Report Information</h5>
            <div className="card">
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <strong>File Name:</strong><br />
                  <span className="text-muted small">{pdfData?.fileName || 'report.pdf'}</span>
                </li>
                <li className="list-group-item">
                  <strong>Storage Location:</strong><br />
                  <span className="text-muted small">Google Drive</span>
                </li>
                <li className="list-group-item">
                  <strong>Generated:</strong><br />
                  <span className="text-muted small">{new Date().toLocaleString()}</span>
                </li>
                <li className="list-group-item">
                  <strong>Access:</strong><br />
                  {pdfData?.shareableLink ? (
                    <a 
                      href={pdfData.shareableLink}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary mt-1"
                    >
                      <i className="bi bi-box-arrow-up-right me-1"></i>
                      View PDF in Google Drive
                    </a>
                  ) : (
                    <span className="text-muted small">Link not available</span>
                  )}
                </li>
              </ul>
            </div>
          </Col>
        </Row>
        
        <Alert variant="light" className="mt-4 mb-0 text-center">
          <i className="bi bi-info-circle me-2"></i>
          <small>The QR code provides quick access to the PDF report stored in Google Drive</small>
        </Alert>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={onDownloadQR} disabled={!qrCodeData}>
          <i className="bi bi-download me-2"></i>
          Download QR Code
        </Button>
        {pdfData?.shareableLink && (
          <Button 
            variant="success" 
            onClick={() => window.open(pdfData.shareableLink, '_blank')}
          >
            <i className="bi bi-file-earmark-pdf me-2"></i>
            Open PDF
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default PDFQRModal;
