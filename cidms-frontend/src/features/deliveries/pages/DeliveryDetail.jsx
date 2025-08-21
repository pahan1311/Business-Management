import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { 
  useGetDeliveryQuery,
  useUpdateDeliveryStatusMutation 
} from '../api';
import StatusBadge from '../../../components/common/StatusBadge';
import QRScanner from '../../../components/common/QRScanner';
import { DELIVERY_STATUS } from '../../../utils/constants';
import { DateTime } from 'luxon';

const DeliveryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();

  const [showScanner, setShowScanner] = useState(false);
  const [completionForm, setCompletionForm] = useState({
    deliveredTo: '',
    signature: '',
    notes: '',
    photo: null,
  });

  const { data: delivery, isLoading, error, refetch } = useGetDeliveryQuery(id);
  const [updateDeliveryStatus, { isLoading: isUpdating }] = useUpdateDeliveryStatusMutation();

  // Auto-open completion form if action=complete in URL
  useEffect(() => {
    if (searchParams.get('action') === 'complete' && delivery?.status === DELIVERY_STATUS.IN_TRANSIT) {
      // Auto-scroll to completion form
      setTimeout(() => {
        document.getElementById('completion-form')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [searchParams, delivery]);

  const handleStatusUpdate = async (newStatus, additionalData = {}) => {
    try {
      await updateDeliveryStatus({
        id: delivery.id,
        status: newStatus,
        timestamp: new Date().toISOString(),
        ...additionalData,
      }).unwrap();

      enqueueSnackbar('Delivery status updated successfully', { variant: 'success' });
      refetch();
    } catch (error) {
      enqueueSnackbar('Failed to update delivery status', { variant: 'error' });
    }
  };

  const handleStartDelivery = () => {
    handleStatusUpdate(DELIVERY_STATUS.IN_TRANSIT, {
      startTime: new Date().toISOString(),
      notes: 'Delivery started by driver',
    });
  };

  const handleCompleteDelivery = async (e) => {
    e.preventDefault();
    
    if (!completionForm.deliveredTo.trim()) {
      enqueueSnackbar('Please specify who received the delivery', { variant: 'error' });
      return;
    }

    const completionData = {
      deliveredTo: completionForm.deliveredTo,
      deliveryNotes: completionForm.notes,
      completedAt: new Date().toISOString(),
    };

    if (completionForm.signature) {
      completionData.signature = completionForm.signature;
    }

    if (completionForm.photo) {
      completionData.deliveryPhoto = completionForm.photo;
    }

    await handleStatusUpdate(DELIVERY_STATUS.DELIVERED, completionData);
  };

  const handleQRScan = (result) => {
    // Verify QR code matches delivery
    if (result === delivery?.qrCode || result.includes(delivery?.orderNumber)) {
      enqueueSnackbar('QR code verified successfully', { variant: 'success' });
      setShowScanner(false);
      
      // Auto-start delivery if not started yet
      if (delivery.status === DELIVERY_STATUS.ASSIGNED) {
        handleStartDelivery();
      }
    } else {
      enqueueSnackbar('QR code does not match this delivery', { variant: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Delivery Not Found</h4>
        <p>The delivery you're looking for could not be found.</p>
        <hr />
        <button
          className="btn btn-outline-danger"
          onClick={() => navigate('/delivery/deliveries')}
        >
          Back to Deliveries
        </button>
      </div>
    );
  }

  return (
    <div className="delivery-detail">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <button
                  className="btn btn-link p-0"
                  onClick={() => navigate('/delivery/deliveries')}
                >
                  Deliveries
                </button>
              </li>
              <li className="breadcrumb-item active">
                Order #{delivery.orderNumber}
              </li>
            </ol>
          </nav>
          <h1>Delivery Details</h1>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary"
            onClick={() => setShowScanner(true)}
          >
            <i className="bi bi-qr-code-scan me-2"></i>
            Scan QR
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={refetch}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Delivery Information */}
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Delivery Information</h5>
              <StatusBadge status={delivery.status} type="delivery" />
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-muted">Order Number</label>
                  <p className="fw-bold">#{delivery.orderNumber}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Scheduled Time</label>
                  <p className="fw-bold">
                    {DateTime.fromISO(delivery.scheduledTime).toFormat('MMM dd, yyyy hh:mm a')}
                  </p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Customer</label>
                  <p className="fw-bold">{delivery.customerName}</p>
                  <p className="text-muted mb-0">{delivery.customerPhone}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Priority</label>
                  <p>
                    {delivery.isUrgent ? (
                      <span className="badge bg-danger">Urgent</span>
                    ) : (
                      <span className="badge bg-secondary">Normal</span>
                    )}
                  </p>
                </div>
                <div className="col-12">
                  <label className="form-label text-muted">Delivery Address</label>
                  <p className="fw-bold">{delivery.deliveryAddress}</p>
                  <p className="text-muted mb-0">Area: {delivery.deliveryArea}</p>
                </div>
                {delivery.specialInstructions && (
                  <div className="col-12">
                    <label className="form-label text-muted">Special Instructions</label>
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      {delivery.specialInstructions}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Order Items</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delivery.items?.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="fw-medium">{item.productName}</div>
                          {item.sku && <small className="text-muted">SKU: {item.sku}</small>}
                        </td>
                        <td>{item.quantity}</td>
                        <td>${item.unitPrice?.toFixed(2)}</td>
                        <td className="text-end fw-bold">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th colSpan="3">Total Amount</th>
                      <th className="text-end">${delivery.totalAmount?.toFixed(2)}</th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Completion Form */}
          {delivery.status === DELIVERY_STATUS.IN_TRANSIT && (
            <div className="card" id="completion-form">
              <div className="card-header bg-success bg-opacity-10">
                <h5 className="mb-0 text-success">
                  <i className="bi bi-check-circle me-2"></i>
                  Complete Delivery
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleCompleteDelivery}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">
                        Delivered To <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={completionForm.deliveredTo}
                        onChange={(e) => setCompletionForm(prev => ({
                          ...prev,
                          deliveredTo: e.target.value
                        }))}
                        placeholder="Name of person who received the delivery"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Signature (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={completionForm.signature}
                        onChange={(e) => setCompletionForm(prev => ({
                          ...prev,
                          signature: e.target.value
                        }))}
                        placeholder="Digital signature or initials"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Delivery Notes (Optional)</label>
                      <textarea
                        className="form-control"
                        value={completionForm.notes}
                        onChange={(e) => setCompletionForm(prev => ({
                          ...prev,
                          notes: e.target.value
                        }))}
                        rows="3"
                        placeholder="Any additional notes about the delivery..."
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Delivery Photo (Optional)</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) => setCompletionForm(prev => ({
                          ...prev,
                          photo: e.target.files[0]
                        }))}
                      />
                      <div className="form-text">
                        Upload a photo of the delivered package or receipt
                      </div>
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-4">
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={isUpdating}
                    >
                      {isUpdating && <span className="spinner-border spinner-border-sm me-2"></span>}
                      <i className="bi bi-check-circle me-2"></i>
                      Complete Delivery
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-warning"
                      onClick={() => handleStatusUpdate(DELIVERY_STATUS.DELAYED, {
                        notes: 'Delivery delayed by driver'
                      })}
                      disabled={isUpdating}
                    >
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Report Issue
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Actions Sidebar */}
        <div className="col-lg-4">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Actions</h5>
            </div>
            <div className="card-body d-grid gap-2">
              {delivery.status === DELIVERY_STATUS.ASSIGNED && (
                <button
                  className="btn btn-primary"
                  onClick={handleStartDelivery}
                  disabled={isUpdating}
                >
                  <i className="bi bi-play-circle me-2"></i>
                  Start Delivery
                </button>
              )}
              
              <button
                className="btn btn-outline-primary"
                onClick={() => setShowScanner(true)}
              >
                <i className="bi bi-qr-code-scan me-2"></i>
                Scan QR Code
              </button>

              <button
                className="btn btn-outline-info"
                onClick={() => {
                  const address = encodeURIComponent(delivery.deliveryAddress);
                  window.open(`https://maps.google.com/maps?q=${address}`, '_blank');
                }}
              >
                <i className="bi bi-map me-2"></i>
                Open in Maps
              </button>

              <button
                className="btn btn-outline-secondary"
                onClick={() => window.open(`tel:${delivery.customerPhone}`)}
              >
                <i className="bi bi-telephone me-2"></i>
                Call Customer
              </button>
            </div>
          </div>

          {/* Delivery Timeline */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Delivery Timeline</h5>
            </div>
            <div className="card-body">
              <div className="timeline">
                <div className="timeline-item completed">
                  <div className="timeline-marker bg-success"></div>
                  <div className="timeline-content">
                    <h6>Order Assigned</h6>
                    <small className="text-muted">
                      {DateTime.fromISO(delivery.assignedAt).toFormat('MMM dd, hh:mm a')}
                    </small>
                  </div>
                </div>
                
                {delivery.startTime && (
                  <div className="timeline-item completed">
                    <div className="timeline-marker bg-primary"></div>
                    <div className="timeline-content">
                      <h6>Delivery Started</h6>
                      <small className="text-muted">
                        {DateTime.fromISO(delivery.startTime).toFormat('MMM dd, hh:mm a')}
                      </small>
                    </div>
                  </div>
                )}

                {delivery.completedAt && (
                  <div className="timeline-item completed">
                    <div className="timeline-marker bg-success"></div>
                    <div className="timeline-content">
                      <h6>Delivery Completed</h6>
                      <small className="text-muted">
                        {DateTime.fromISO(delivery.completedAt).toFormat('MMM dd, hh:mm a')}
                      </small>
                      {delivery.deliveredTo && (
                        <p className="mb-0 small">Delivered to: {delivery.deliveredTo}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default DeliveryDetail;
