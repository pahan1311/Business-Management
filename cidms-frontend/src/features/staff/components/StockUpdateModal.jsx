import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { 
  useUpdateInventoryMutation,
  useCreateStockMovementMutation 
} from '../../inventory/api';

const StockUpdateModal = ({ product, onClose, onSuccess }) => {
  const [movementType, setMovementType] = useState('INBOUND');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('RESTOCK');
  const [notes, setNotes] = useState('');

  const { enqueueSnackbar } = useSnackbar();
  
  const [updateInventory, { isLoading: isUpdatingInventory }] = useUpdateInventoryMutation();
  const [createStockMovement, { isLoading: isCreatingMovement }] = useCreateStockMovementMutation();

  const isLoading = isUpdatingInventory || isCreatingMovement;

  const reasonOptions = {
    INBOUND: [
      { value: 'RESTOCK', label: 'Restock' },
      { value: 'RETURN', label: 'Customer Return' },
      { value: 'ADJUSTMENT', label: 'Inventory Adjustment' },
      { value: 'TRANSFER', label: 'Transfer In' },
    ],
    OUTBOUND: [
      { value: 'SALE', label: 'Sale' },
      { value: 'DAMAGE', label: 'Damaged' },
      { value: 'EXPIRED', label: 'Expired' },
      { value: 'ADJUSTMENT', label: 'Inventory Adjustment' },
      { value: 'TRANSFER', label: 'Transfer Out' },
    ],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!quantity || parseInt(quantity) <= 0) {
      enqueueSnackbar('Please enter a valid quantity', { variant: 'error' });
      return;
    }

    const quantityNum = parseInt(quantity);
    const newStock = movementType === 'INBOUND' 
      ? (product?.currentStock || 0) + quantityNum
      : (product?.currentStock || 0) - quantityNum;

    if (newStock < 0) {
      enqueueSnackbar('Insufficient stock for this operation', { variant: 'error' });
      return;
    }

    try {
      // Create stock movement record
      await createStockMovement({
        productId: product?.id,
        type: movementType,
        quantity: quantityNum,
        reason,
        notes: notes || `Stock ${movementType.toLowerCase()} by staff`,
      }).unwrap();

      // Update inventory if product is provided
      if (product) {
        await updateInventory({
          id: product.id,
          currentStock: newStock,
        }).unwrap();
      }

      enqueueSnackbar(
        `Stock ${movementType === 'INBOUND' ? 'added' : 'removed'} successfully`,
        { variant: 'success' }
      );

      onSuccess();
    } catch (error) {
      enqueueSnackbar('Failed to update stock', { variant: 'error' });
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {product ? `Update Stock - ${product.name}` : 'Stock Movement'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={isLoading}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {product && (
                <div className="alert alert-info d-flex align-items-center mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  <div>
                    <strong>Current Stock:</strong> {product.currentStock} {product.unit}
                    <br />
                    <strong>SKU:</strong> {product.sku}
                  </div>
                </div>
              )}

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Movement Type</label>
                  <select
                    className="form-select"
                    value={movementType}
                    onChange={(e) => {
                      setMovementType(e.target.value);
                      setReason(reasonOptions[e.target.value][0].value);
                    }}
                    required
                  >
                    <option value="INBOUND">Inbound (Add Stock)</option>
                    <option value="OUTBOUND">Outbound (Remove Stock)</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    className="form-control"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Reason</label>
                  <select
                    className="form-select"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  >
                    {reasonOptions[movementType].map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                    placeholder="Additional notes about this stock movement..."
                  />
                </div>
              </div>

              {product && quantity && (
                <div className="mt-3">
                  <div className="alert alert-light border">
                    <strong>Preview:</strong>
                    <br />
                    Current Stock: {product.currentStock} {product.unit}
                    <br />
                    {movementType === 'INBOUND' ? '+' : '-'}{quantity} {product.unit}
                    <br />
                    <strong>
                      New Stock: {
                        movementType === 'INBOUND' 
                          ? product.currentStock + parseInt(quantity || 0)
                          : product.currentStock - parseInt(quantity || 0)
                      } {product.unit}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn ${movementType === 'INBOUND' ? 'btn-success' : 'btn-warning'}`}
                disabled={isLoading}
              >
                {isLoading && <span className="spinner-border spinner-border-sm me-2"></span>}
                {movementType === 'INBOUND' ? 'Add Stock' : 'Remove Stock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StockUpdateModal;
