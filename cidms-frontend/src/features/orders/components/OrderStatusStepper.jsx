import { ORDER_STATUSES } from '../../../utils/constants';

const OrderStatusStepper = ({ currentStatus, className = "" }) => {
  const statusFlow = [
    { key: ORDER_STATUSES.PENDING, label: 'Pending', icon: 'clock' },
    { key: ORDER_STATUSES.CONFIRMED, label: 'Confirmed', icon: 'check-circle' },
    { key: ORDER_STATUSES.PREPARING, label: 'Preparing', icon: 'gear' },
    { key: ORDER_STATUSES.READY_FOR_DISPATCH, label: 'Ready', icon: 'box-seam' },
    { key: ORDER_STATUSES.OUT_FOR_DELIVERY, label: 'Out for Delivery', icon: 'truck' },
    { key: ORDER_STATUSES.DELIVERED, label: 'Delivered', icon: 'check-circle-fill' },
  ];

  const getCurrentStepIndex = () => {
    if (currentStatus === ORDER_STATUSES.CANCELED) return -1;
    return statusFlow.findIndex(step => step.key === currentStatus);
  };

  const currentStepIndex = getCurrentStepIndex();
  const isCanceled = currentStatus === ORDER_STATUSES.CANCELED;

  if (isCanceled) {
    return (
      <div className={`order-status-stepper ${className}`}>
        <div className="card">
          <div className="card-body text-center">
            <div className="mb-3">
              <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '3rem' }}></i>
            </div>
            <h5 className="text-danger">Order Canceled</h5>
            <p className="text-muted mb-0">This order has been canceled</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`order-status-stepper ${className}`}>
      <div className="card">
        <div className="card-body">
          <div className="row">
            {statusFlow.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isUpcoming = index > currentStepIndex;
              
              return (
                <div key={step.key} className="col">
                  <div className="text-center">
                    {/* Step Icon */}
                    <div className="mb-2">
                      <div 
                        className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                          isCompleted ? 'bg-success text-white' :
                          isCurrent ? 'bg-primary text-white' :
                          'bg-light text-muted'
                        }`}
                        style={{ width: '40px', height: '40px' }}
                      >
                        <i className={`bi bi-${step.icon}`}></i>
                      </div>
                    </div>
                    
                    {/* Step Label */}
                    <div>
                      <small 
                        className={`fw-bold ${
                          isCompleted ? 'text-success' :
                          isCurrent ? 'text-primary' :
                          'text-muted'
                        }`}
                      >
                        {step.label}
                      </small>
                    </div>
                    
                    {/* Connection Line */}
                    {index < statusFlow.length - 1 && (
                      <div 
                        className={`position-absolute top-50 translate-middle-y ${
                          isCompleted ? 'bg-success' : 'bg-light'
                        }`}
                        style={{ 
                          left: 'calc(50% + 20px)', 
                          width: 'calc(100% - 40px)', 
                          height: '2px',
                          zIndex: -1
                        }}
                      ></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Current Status Description */}
          <div className="text-center mt-4">
            <div className="alert alert-info mb-0">
              <strong>Current Status:</strong> {statusFlow[currentStepIndex]?.label || 'Unknown'}
              {isCurrent && (
                <div className="mt-1">
                  <small className="text-muted">
                    {getStatusDescription(currentStatus)}
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getStatusDescription = (status) => {
  const descriptions = {
    [ORDER_STATUSES.PENDING]: 'Your order is being reviewed',
    [ORDER_STATUSES.CONFIRMED]: 'Your order has been confirmed and will be prepared soon',
    [ORDER_STATUSES.PREPARING]: 'Your order is being prepared by our staff',
    [ORDER_STATUSES.READY_FOR_DISPATCH]: 'Your order is ready and will be dispatched soon',
    [ORDER_STATUSES.OUT_FOR_DELIVERY]: 'Your order is on the way to you',
    [ORDER_STATUSES.DELIVERED]: 'Your order has been successfully delivered',
  };
  
  return descriptions[status] || '';
};

export default OrderStatusStepper;
