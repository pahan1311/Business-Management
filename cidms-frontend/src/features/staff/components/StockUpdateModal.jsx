import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { 
  useUpdateProductStockMutation
} from '../../inventory/api';

const StockUpdateModal = ({ open, product, onClose, onSuccess }) => {
  const [movement, setMovement] = useState({
    type: 'IN',
    quantity: '',
    reference: '',
    notes: ''
  });

  const { enqueueSnackbar } = useSnackbar();
  const [updateProductStock, { isLoading }] = useUpdateProductStockMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!movement.quantity || parseInt(movement.quantity) <= 0) {
      enqueueSnackbar('Please enter a valid quantity', { variant: 'error' });
      return;
    }

    try {
      await updateProductStock({
        id: product.id,
        movement: {
          ...movement,
          quantity: parseInt(movement.quantity)
        }
      }).unwrap();

      enqueueSnackbar(
        `Stock ${movement.type === 'IN' ? 'added' : 'removed'} successfully`, 
        { variant: 'success' }
      );
      
      handleClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      enqueueSnackbar('Failed to update stock', { variant: 'error' });
    }
  };

  const handleClose = () => {
    setMovement({
      type: 'IN',
      quantity: '',
      reference: '',
      notes: ''
    });
    onClose();
  };

  const getNewStockLevel = () => {
    if (!movement.quantity || !product) return product?.currentStock || 0;
    
    const qty = parseInt(movement.quantity);
    const currentStock = product.currentStock || 0;
    
    if (movement.type === 'IN') {
      return currentStock + qty;
    } else {
      return Math.max(0, currentStock - qty);
    }
  };

  const isStockRemovalValid = () => {
    if (movement.type === 'OUT' && movement.quantity) {
      return parseInt(movement.quantity) <= (product?.currentStock || 0);
    }
    return true;
  };

  if (!product || !open) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-arrow-up-down me-2"></i>
              Update Stock - {product.name}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              disabled={isLoading}
            ></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Product Info */}
              <div className="alert alert-info mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">{product.name}</h6>
                    <p className="mb-0">SKU: {product.sku}</p>
                  </div>
                  <div className="text-end">
                    <div className="fs-4">{product.currentStock} {product.unit}</div>
                    <small className="text-muted">Current Stock</small>
                  </div>
                </div>
              </div>

              {/* Movement Type */}
              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-arrow-left-right me-2"></i>
                  Movement Type <span className="text-danger">*</span>
                </label>
                <div className="d-flex gap-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="movementType"
                      id="stock-in"
                      value="IN"
                      checked={movement.type === 'IN'}
                      onChange={(e) => setMovement({ ...movement, type: e.target.value })}
                    />
                    <label className="form-check-label" htmlFor="stock-in">
                      Stock In (Add)
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="movementType"
                      id="stock-out"
                      value="OUT"
                      checked={movement.type === 'OUT'}
                      onChange={(e) => setMovement({ ...movement, type: e.target.value })}
                    />
                    <label className="form-check-label" htmlFor="stock-out">
                      Stock Out (Remove)
                    </label>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-123 me-2"></i>
                  Quantity <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    className={`form-control ${!isStockRemovalValid() ? 'is-invalid' : ''}`}
                    min="1"
                    max={movement.type === 'OUT' ? product.currentStock : undefined}
                    value={movement.quantity}
                    onChange={(e) => setMovement({ ...movement, quantity: e.target.value })}
                    placeholder="Enter quantity"
                    required
                  />
                  <span className="input-group-text">{product.unit}</span>
                  {!isStockRemovalValid() && (
                    <div className="invalid-feedback">
                      Cannot remove more than available stock ({product.currentStock} {product.unit})
                    </div>
                  )}
                </div>
              </div>

              {/* Reference */}
              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-bookmark me-2"></i>
                  Reference
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={movement.reference}
                  onChange={(e) => setMovement({ ...movement, reference: e.target.value })}
                  placeholder="e.g., Purchase Order #123, Return #456"
                />
              </div>

              {/* Notes */}
              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-chat-text me-2"></i>
                  Notes
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={movement.notes}
                  onChange={(e) => setMovement({ ...movement, notes: e.target.value })}
                  placeholder="Additional notes about this stock movement"
                />
              </div>

              {/* Stock Preview */}
              {movement.quantity && (
                <div className={`alert alert-${movement.type === 'IN' ? 'success' : 'warning'} mb-0`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Stock After Update:</strong>
                    </div>
                    <div className="fs-5">
                      {getNewStockLevel()} {product.unit}
                      <span className="ms-2 text-muted">
                        ({movement.type === 'IN' ? '+' : '-'}{movement.quantity} {product.unit})
                      </span>
                    </div>
                  </div>
                  {movement.type === 'OUT' && getNewStockLevel() <= (product.reorderLevel || 0) && (
                    <div className="mt-2 text-warning">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      Warning: Stock will be at or below reorder level
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
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-${movement.type === 'IN' ? 'success' : 'warning'}`}
                disabled={isLoading || !movement.quantity || !isStockRemovalValid()}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Updating...
                  </>
                ) : (
                  <>
                    <i className={`bi bi-${movement.type === 'IN' ? 'plus' : 'dash'}-circle me-2`}></i>
                    Update Stock
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StockUpdateModal;
