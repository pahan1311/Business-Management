import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { deliveryTaskSchema } from '../../../utils/validators';
import { DELIVERY_PRIORITY, DELIVERY_TYPES } from '../../../utils/constants';
import { DateTime } from 'luxon';

const DeliveryTaskForm = ({
  orders = [],
  drivers = [],
  onSubmit = () => {},
  isLoading = false,
  onCancel = () => {},
  className = "",
  initialValues = null
}) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(deliveryTaskSchema),
    defaultValues: {
      orderId: initialValues?.orderId || '',
      driverId: initialValues?.driverId || '',
      type: initialValues?.type || DELIVERY_TYPES.STANDARD,
      priority: initialValues?.priority || DELIVERY_PRIORITY.NORMAL,
      scheduledDate: initialValues?.scheduledDate || DateTime.now().plus({ days: 1 }).toISODate(),
      timeSlot: initialValues?.timeSlot || 'morning',
      instructions: initialValues?.instructions || '',
      notes: initialValues?.notes || ''
    },
  });

  const selectedOrderId = watch('orderId');
  const selectedDriverId = watch('driverId');
  const deliveryType = watch('type');
  const priority = watch('priority');
  const scheduledDate = watch('scheduledDate');

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

  const deliveryTypes = [
    { value: DELIVERY_TYPES.STANDARD, label: 'Standard Delivery', icon: 'truck', color: 'primary' },
    { value: DELIVERY_TYPES.EXPRESS, label: 'Express Delivery', icon: 'lightning', color: 'warning' },
    { value: DELIVERY_TYPES.SAME_DAY, label: 'Same Day Delivery', icon: 'clock', color: 'danger' },
    { value: DELIVERY_TYPES.PICKUP, label: 'Customer Pickup', icon: 'person-check', color: 'success' },
  ];

  const priorities = [
    { value: DELIVERY_PRIORITY.LOW, label: 'Low', color: 'secondary' },
    { value: DELIVERY_PRIORITY.NORMAL, label: 'Normal', color: 'primary' },
    { value: DELIVERY_PRIORITY.HIGH, label: 'High', color: 'warning' },
    { value: DELIVERY_PRIORITY.URGENT, label: 'Urgent', color: 'danger' },
  ];

  const timeSlots = [
    { value: 'morning', label: 'Morning (8:00 AM - 12:00 PM)' },
    { value: 'afternoon', label: 'Afternoon (12:00 PM - 5:00 PM)' },
    { value: 'evening', label: 'Evening (5:00 PM - 8:00 PM)' },
    { value: 'flexible', label: 'Flexible' },
  ];

  const getTypeConfig = (type) => {
    return deliveryTypes.find(t => t.value === type) || deliveryTypes[0];
  };

  const getPriorityConfig = (priority) => {
    return priorities.find(p => p.value === priority) || priorities[1];
  };

  const typeConfig = getTypeConfig(deliveryType);
  const priorityConfig = getPriorityConfig(priority);

  // Calculate estimated delivery time based on type
  const getEstimatedDelivery = (type, date) => {
    if (!date) return null;
    
    const baseDate = DateTime.fromISO(date);
    const configs = {
      [DELIVERY_TYPES.SAME_DAY]: { days: 0, label: 'Same Day' },
      [DELIVERY_TYPES.EXPRESS]: { days: 1, label: '1-2 Days' },
      [DELIVERY_TYPES.STANDARD]: { days: 3, label: '3-5 Days' },
      [DELIVERY_TYPES.PICKUP]: { days: 0, label: 'Available for Pickup' }
    };
    
    const config = configs[type] || configs[DELIVERY_TYPES.STANDARD];
    const estimatedDate = baseDate.plus({ days: config.days });
    
    return {
      date: estimatedDate.toLocaleString(DateTime.DATE_MED),
      label: config.label
    };
  };

  const estimatedDelivery = getEstimatedDelivery(deliveryType, scheduledDate);

  return (
    <div className={`delivery-task-form ${className}`}>
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">
            <i className={`bi bi-${typeConfig.icon} text-${typeConfig.color} me-2`}></i>
            Create Delivery Task
          </h6>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="row">
              {/* Order Selection */}
              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <Controller
                    name="orderId"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className={`form-select ${errors.orderId ? 'is-invalid' : ''}`}
                        id="orderId"
                      >
                        <option value="">Select Order</option>
                        {orders.map(order => (
                          <option key={order.id} value={order.id}>
                            #{order.orderNumber} - {order.customerName}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <label htmlFor="orderId">Order</label>
                  {errors.orderId && (
                    <div className="invalid-feedback">{errors.orderId.message}</div>
                  )}
                </div>
              </div>

              {/* Driver Assignment */}
              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <Controller
                    name="driverId"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className={`form-select ${errors.driverId ? 'is-invalid' : ''}`}
                        id="driverId"
                      >
                        <option value="">Assign Driver</option>
                        {drivers.map(driver => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name} - {driver.vehicle?.licensePlate}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <label htmlFor="driverId">Driver</label>
                  {errors.driverId && (
                    <div className="invalid-feedback">{errors.driverId.message}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Order Info */}
            {selectedOrder && (
              <div className="alert alert-info mb-3">
                <div className="row">
                  <div className="col-md-6">
                    <strong>Customer:</strong> {selectedOrder.customerName}<br/>
                    <strong>Items:</strong> {selectedOrder.totalItems} items
                  </div>
                  <div className="col-md-6">
                    <strong>Address:</strong> {selectedOrder.deliveryAddress}<br/>
                    <strong>Value:</strong> ${selectedOrder.totalAmount}
                  </div>
                </div>
              </div>
            )}

            {/* Selected Driver Info */}
            {selectedDriver && (
              <div className="alert alert-success mb-3">
                <div className="row">
                  <div className="col-md-6">
                    <strong>Driver:</strong> {selectedDriver.name}<br/>
                    <strong>Phone:</strong> {selectedDriver.phone}
                  </div>
                  <div className="col-md-6">
                    <strong>Vehicle:</strong> {selectedDriver.vehicle?.make} {selectedDriver.vehicle?.model}<br/>
                    <strong>License:</strong> {selectedDriver.vehicle?.licensePlate}
                  </div>
                </div>
              </div>
            )}

            <div className="row">
              {/* Delivery Type */}
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
                        {deliveryTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <label htmlFor="type">Delivery Type</label>
                  {errors.type && (
                    <div className="invalid-feedback">{errors.type.message}</div>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className={`form-select ${errors.priority ? 'is-invalid' : ''}`}
                        id="priority"
                      >
                        {priorities.map(priority => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <label htmlFor="priority">Priority</label>
                  {errors.priority && (
                    <div className="invalid-feedback">{errors.priority.message}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Current Selections Display */}
            <div className="mb-3">
              <span className={`badge bg-${typeConfig.color} me-2`}>
                <i className={`bi bi-${typeConfig.icon} me-1`}></i>
                {typeConfig.label}
              </span>
              <span className={`badge bg-${priorityConfig.color}`}>
                {priorityConfig.label} Priority
              </span>
            </div>

            <div className="row">
              {/* Scheduled Date */}
              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <input
                    type="date"
                    className={`form-control ${errors.scheduledDate ? 'is-invalid' : ''}`}
                    id="scheduledDate"
                    min={DateTime.now().toISODate()}
                    {...register('scheduledDate')}
                  />
                  <label htmlFor="scheduledDate">Scheduled Date</label>
                  {errors.scheduledDate && (
                    <div className="invalid-feedback">{errors.scheduledDate.message}</div>
                  )}
                </div>
              </div>

              {/* Time Slot */}
              <div className="col-md-6">
                <div className="form-floating mb-3">
                  <Controller
                    name="timeSlot"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className={`form-select ${errors.timeSlot ? 'is-invalid' : ''}`}
                        id="timeSlot"
                      >
                        {timeSlots.map(slot => (
                          <option key={slot.value} value={slot.value}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <label htmlFor="timeSlot">Time Slot</label>
                  {errors.timeSlot && (
                    <div className="invalid-feedback">{errors.timeSlot.message}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Estimated Delivery */}
            {estimatedDelivery && (
              <div className="alert alert-light border mb-3">
                <i className="bi bi-calendar-check text-success me-2"></i>
                <strong>Estimated Delivery:</strong> {estimatedDelivery.date} ({estimatedDelivery.label})
              </div>
            )}

            {/* Special Instructions */}
            <div className="form-floating mb-3">
              <textarea
                className={`form-control ${errors.instructions ? 'is-invalid' : ''}`}
                id="instructions"
                placeholder="Special delivery instructions"
                style={{ height: '100px' }}
                {...register('instructions')}
              ></textarea>
              <label htmlFor="instructions">Delivery Instructions</label>
              {errors.instructions && (
                <div className="invalid-feedback">{errors.instructions.message}</div>
              )}
            </div>

            {/* Notes */}
            <div className="form-floating mb-3">
              <textarea
                className="form-control"
                id="notes"
                placeholder="Internal notes"
                style={{ height: '80px' }}
                {...register('notes')}
              ></textarea>
              <label htmlFor="notes">Internal Notes (Optional)</label>
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
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-circle me-2"></i>
                    Create Task
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

export default DeliveryTaskForm;
