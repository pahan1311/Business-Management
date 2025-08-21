import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stockMovementSchema } from '../../../utils/validators';
import { STOCK_MOVEMENT_TYPES } from '../../../utils/constants';

const StockMovementForm = ({ 
  products = [], 
  onSubmit = () => {}, 
  isLoading = false,
  initialProduct = null,
  onCancel = () => {},
  className = ""
}) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      productId: initialProduct?.id || '',
      type: 'IN',
      quantity: 1,
      reason: '',
    },
  });

  const selectedProductId = watch('productId');
  const movementType = watch('type');
  const selectedProduct = products.find(p => p.id === selectedProductId);

  const movementTypes = [
    { value: STOCK_MOVEMENT_TYPES.IN, label: 'Stock In', description: 'Add inventory (received goods)' },
    { value: STOCK_MOVEMENT_TYPES.OUT, label: 'Stock Out', description: 'Remove inventory (damaged, lost, etc.)' },
    { value: STOCK_MOVEMENT_TYPES.ADJUST, label: 'Adjustment', description: 'Correct inventory count' },
  ];

  const getMovementTypeConfig = (type) => {
    const configs = {
      [STOCK_MOVEMENT_TYPES.IN]: { color: 'success', icon: 'arrow-up-circle' },
      [STOCK_MOVEMENT_TYPES.OUT]: { color: 'danger', icon: 'arrow-down-circle' },
      [STOCK_MOVEMENT_TYPES.ADJUST]: { color: 'warning', icon: 'arrow-left-right' },
    };
    return configs[type] || { color: 'secondary', icon: 'circle' };
  };

  const typeConfig = getMovementTypeConfig(movementType);

  return (
    <div className={`stock-movement-form ${className}`}>
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">
            <i className={`bi bi-${typeConfig.icon} text-${typeConfig.color} me-2`}></i>
            Stock Movement
          </h6>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="row">
              {/* Product Selection */}
              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <Controller
                    name="productId"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className={`form-select ${errors.productId ? 'is-invalid' : ''}`}
                        id="productId"
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.sku} - {product.name}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <label htmlFor="productId">Product</label>
                  {errors.productId && (
                    <div className="invalid-feedback">{errors.productId.message}</div>
                  )}
                </div>
              </div>

              {/* Movement Type */}
              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className={`form-select ${errors.type ? 'is-invalid' : ''}`}
                        id="type"
                      >
                        {movementTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <label htmlFor="type">Movement Type</label>
                  {errors.type && (
                    <div className="invalid-feedback">{errors.type.message}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Current Stock Info */}
            {selectedProduct && (
              <div className="alert alert-info mb-3">
                <div className="row">
                  <div className="col-md-4">
                    <strong>Current Stock:</strong> {selectedProduct.onHand || 0}
                  </div>
                  <div className="col-md-4">
                    <strong>Reserved:</strong> {selectedProduct.reserved || 0}
                  </div>
                  <div className="col-md-4">
                    <strong>Available:</strong> {(selectedProduct.onHand || 0) - (selectedProduct.reserved || 0)}
                  </div>
                </div>
              </div>
            )}

            {/* Movement Type Description */}
            {movementType && (
              <div className={`alert alert-${typeConfig.color} alert-dismissible fade show mb-3`}>
                <strong>{movementTypes.find(t => t.value === movementType)?.label}:</strong>
                {' '}
                {movementTypes.find(t => t.value === movementType)?.description}
              </div>
            )}

            <div className="row">
              {/* Quantity */}
              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <input
                    type="number"
                    className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                    id="quantity"
                    placeholder="Quantity"
                    min="1"
                    step="1"
                    {...register('quantity', { valueAsNumber: true })}
                  />
                  <label htmlFor="quantity">Quantity</label>
                  {errors.quantity && (
                    <div className="invalid-feedback">{errors.quantity.message}</div>
                  )}
                </div>
              </div>

              {/* Unit Cost (for IN movements) */}
              {movementType === STOCK_MOVEMENT_TYPES.IN && (
                <div className="col-md-6">
                  <div className="form-floating mb-3">
                    <input
                      type="number"
                      className="form-control"
                      id="unitCost"
                      placeholder="Unit Cost (Optional)"
                      min="0"
                      step="0.01"
                      {...register('unitCost', { valueAsNumber: true })}
                    />
                    <label htmlFor="unitCost">Unit Cost (Optional)</label>
                  </div>
                </div>
              )}
            </div>

            {/* Reason */}
            <div className="form-floating mb-3">
              <textarea
                className={`form-control ${errors.reason ? 'is-invalid' : ''}`}
                id="reason"
                placeholder="Reason for movement"
                style={{ height: '100px' }}
                {...register('reason')}
              ></textarea>
              <label htmlFor="reason">Reason for Movement</label>
              {errors.reason && (
                <div className="invalid-feedback">{errors.reason.message}</div>
              )}
            </div>

            {/* Notes */}
            <div className="form-floating mb-3">
              <textarea
                className="form-control"
                id="notes"
                placeholder="Additional notes (optional)"
                style={{ height: '80px' }}
                {...register('notes')}
              ></textarea>
              <label htmlFor="notes">Notes (Optional)</label>
            </div>

            {/* Actions */}
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-${typeConfig.color}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className={`bi bi-${typeConfig.icon} me-2`}></i>
                    Submit Movement
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

export default StockMovementForm;
