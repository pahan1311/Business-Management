import { ORDER_STATUS } from '../../utils/constants';

const OrderStatusStepper = ({ currentStatus, orderDate, statusHistory = [] }) => {
  const steps = [
    { 
      key: ORDER_STATUS.PENDING, 
      label: 'Order Placed', 
      icon: 'bi-cart-plus',
      description: 'Order has been placed and is waiting for confirmation'
    },
    { 
      key: ORDER_STATUS.CONFIRMED, 
      label: 'Confirmed', 
      icon: 'bi-check-circle',
      description: 'Order confirmed and ready for preparation'
    },
    { 
      key: ORDER_STATUS.PROCESSING, 
      label: 'Processing', 
      icon: 'bi-gear',
      description: 'Order is being prepared'
    },
    { 
      key: ORDER_STATUS.READY_FOR_DELIVERY, 
      label: 'Ready for Delivery', 
      icon: 'bi-box-seam',
      description: 'Order is packed and ready for dispatch'
    },
    { 
      key: ORDER_STATUS.OUT_FOR_DELIVERY, 
      label: 'Out for Delivery', 
      icon: 'bi-truck',
      description: 'Order is on the way to delivery address'
    },
    { 
      key: ORDER_STATUS.DELIVERED, 
      label: 'Delivered', 
      icon: 'bi-check2-circle',
      description: 'Order has been successfully delivered'
    }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === currentStatus);
  };

  const isStepCompleted = (stepIndex) => {
    return stepIndex <= getCurrentStepIndex();
  };

  const isStepActive = (stepIndex) => {
    return stepIndex === getCurrentStepIndex();
  };

  const getStepTimestamp = (stepKey) => {
    const historyItem = statusHistory.find(item => item.status === stepKey);
    if (historyItem) {
      return new Date(historyItem.timestamp).toLocaleString();
    }
    // For the first step (order placed), use order date if no history
    if (stepKey === ORDER_STATUS.PENDING && orderDate) {
      return new Date(orderDate).toLocaleString();
    }
    return null;
  };

  const getStepVariant = (stepIndex) => {
    if (isStepCompleted(stepIndex)) {
      return isStepActive(stepIndex) ? 'primary' : 'success';
    }
    return 'secondary';
  };

  // Handle cancelled or failed orders
  const isCancelledOrFailed = [ORDER_STATUS.CANCELLED, ORDER_STATUS.FAILED].includes(currentStatus);

  return (
    <div className="order-status-stepper">
      <div className="d-flex align-items-center justify-content-between position-relative">
        {/* Progress line */}
        <div 
          className="position-absolute bg-light" 
          style={{ 
            height: '2px', 
            width: '100%', 
            top: '20px',
            zIndex: 1 
          }}
        />
        <div 
          className={`position-absolute bg-${isCancelledOrFailed ? 'danger' : 'success'}`}
          style={{ 
            height: '2px', 
            width: isCancelledOrFailed ? '100%' : `${(getCurrentStepIndex() / (steps.length - 1)) * 100}%`, 
            top: '20px',
            zIndex: 2,
            transition: 'width 0.3s ease'
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = isStepCompleted(index);
          const isActive = isStepActive(index);
          const variant = getStepVariant(index);
          const timestamp = getStepTimestamp(step.key);
          
          return (
            <div key={step.key} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 3 }}>
              {/* Step circle */}
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center bg-${variant} ${
                  isCompleted ? 'text-white' : 'text-muted'
                }`}
                style={{
                  width: '40px',
                  height: '40px',
                  border: isActive ? '3px solid' : '2px solid',
                  borderColor: isActive ? (isCancelledOrFailed ? '#dc3545' : '#0d6efd') : '#dee2e6',
                  backgroundColor: isCompleted 
                    ? (isCancelledOrFailed ? '#dc3545' : (isActive ? '#0d6efd' : '#198754'))
                    : '#ffffff'
                }}
              >
                <i className={`bi ${step.icon} ${isActive ? 'fs-6' : 'fs-7'}`}></i>
              </div>

              {/* Step label and description */}
              <div className="text-center mt-2" style={{ maxWidth: '120px' }}>
                <div className={`small fw-medium ${isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted'}`}>
                  {step.label}
                </div>
                {timestamp && (
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {timestamp}
                  </div>
                )}
              </div>

              {/* Step description on hover */}
              <div 
                className="position-absolute bg-dark text-white p-2 rounded shadow-sm small"
                style={{
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '10px',
                  whiteSpace: 'nowrap',
                  opacity: 0,
                  pointerEvents: 'none',
                  transition: 'opacity 0.3s ease',
                  zIndex: 1000
                }}
                data-bs-toggle="tooltip"
                title={step.description}
              >
                {step.description}
                <div 
                  className="position-absolute start-50 translate-middle-x bg-dark"
                  style={{
                    top: '100%',
                    width: '8px',
                    height: '8px',
                    transform: 'translateX(-50%) rotate(45deg)'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancelled/Failed status display */}
      {isCancelledOrFailed && (
        <div className="alert alert-danger mt-4 d-flex align-items-center">
          <i className={`bi ${currentStatus === ORDER_STATUS.CANCELLED ? 'bi-x-circle' : 'bi-exclamation-triangle'} me-2 fs-5`}></i>
          <div>
            <strong>
              {currentStatus === ORDER_STATUS.CANCELLED ? 'Order Cancelled' : 'Order Failed'}
            </strong>
            <div className="small mt-1">
              {currentStatus === ORDER_STATUS.CANCELLED 
                ? 'This order has been cancelled and will not be processed.'
                : 'This order encountered an issue and could not be completed.'
              }
            </div>
            {getStepTimestamp(currentStatus) && (
              <div className="small text-muted mt-1">
                {currentStatus === ORDER_STATUS.CANCELLED ? 'Cancelled' : 'Failed'} on: {getStepTimestamp(currentStatus)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current status info */}
      {!isCancelledOrFailed && (
        <div className="mt-4">
          <div className="alert alert-info d-flex align-items-center">
            <i className="bi bi-info-circle me-2"></i>
            <div>
              <strong>Current Status: {steps[getCurrentStepIndex()]?.label}</strong>
              <div className="small mt-1">
                {steps[getCurrentStepIndex()]?.description}
              </div>
              {getStepTimestamp(currentStatus) && (
                <div className="small text-muted mt-1">
                  Updated on: {getStepTimestamp(currentStatus)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStatusStepper;
