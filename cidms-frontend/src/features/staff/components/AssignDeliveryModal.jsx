import { useState } from 'react';
import { useSnackbar } from 'notistack';

const AssignDeliveryModal = ({ open, order, deliveryPartners, onAssign, onClose, loading }) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  const handleAssign = () => {
    if (!selectedPartnerId) {
      enqueueSnackbar('Please select a delivery partner', { variant: 'error' });
      return;
    }

    const assignmentData = {
      partnerId: selectedPartnerId,
      instructions: deliveryInstructions,
      expectedDeliveryDate: expectedDeliveryDate || null
    };

    onAssign(assignmentData);
  };

  const handleClose = () => {
    setSelectedPartnerId('');
    setDeliveryInstructions('');
    setExpectedDeliveryDate('');
    onClose();
  };

  // Set tomorrow as default expected delivery date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  if (!expectedDeliveryDate && open) {
    setExpectedDeliveryDate(defaultDate);
  }

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-person-plus me-2"></i>
              Assign Delivery Partner
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
            ></button>
          </div>
          
          <div className="modal-body">
            {order && (
              <div>
                {/* Order Info */}
                <div className="alert alert-info mb-4">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="alert-heading">Order #{order.orderNumber}</h6>
                      <p className="mb-1">Customer: {order.customerName}</p>
                      <p className="mb-0">Items: {order.totalItems} | Total: ${order.totalAmount?.toFixed(2)}</p>
                    </div>
                    <span className={`badge bg-${
                      order.status === 'READY_FOR_DELIVERY' ? 'success' : 
                      order.status === 'PROCESSING' ? 'warning' : 'secondary'
                    }`}>
                      {order.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <form>
                  {/* Delivery Partner Selection */}
                  <div className="mb-3">
                    <label className="form-label">
                      <i className="bi bi-person me-2"></i>
                      Select Delivery Partner <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedPartnerId}
                      onChange={(e) => setSelectedPartnerId(e.target.value)}
                      required
                    >
                      <option value="">Choose a delivery partner...</option>
                      {deliveryPartners?.filter(partner => partner.isActive).map(partner => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name} - {partner.email}
                          {partner.phone && ` (${partner.phone})`}
                        </option>
                      ))}
                    </select>
                    {deliveryPartners?.length === 0 && (
                      <small className="text-warning">
                        No active delivery partners available. Please add delivery partners first.
                      </small>
                    )}
                  </div>

              {/* Expected Delivery Date */}
              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-calendar me-2"></i>
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Delivery Instructions */}
              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-chat-text me-2"></i>
                  Delivery Instructions
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Enter any special delivery instructions..."
                />
                <small className="text-muted">
                  Optional: Any special instructions for the delivery partner
                </small>
              </div>

              {/* Customer Address Display */}
              {(order.deliveryAddress || order.customer?.address) && (
                <div className="mb-3">
                  <label className="form-label">
                    <i className="bi bi-geo-alt me-2"></i>
                    Delivery Address
                  </label>
                  <textarea
                    className="form-control bg-light"
                    rows={2}
                    value={order.deliveryAddress || order.customer?.address}
                    readOnly
                  />
                </div>
              )}
            </form>

            {/* Assignment Preview */}
            {selectedPartnerId && (
              <div className="alert alert-light border">
                <h6 className="alert-heading">
                  <i className="bi bi-info-circle me-2"></i>
                  Assignment Summary
                </h6>
                <ul className="mb-0">
                  <li>Order will be assigned to {deliveryPartners?.find(p => p.id === selectedPartnerId)?.name}</li>
                  <li>Expected delivery: {expectedDeliveryDate ? new Date(expectedDeliveryDate).toLocaleDateString() : 'Not specified'}</li>
                  <li>QR code will be generated for delivery tracking</li>
                  <li>Customer and delivery partner will receive notifications</li>
                </ul>
              </div>
            )}
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAssign}
              disabled={!selectedPartnerId || loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Assigning...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Assign Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignDeliveryModal;
