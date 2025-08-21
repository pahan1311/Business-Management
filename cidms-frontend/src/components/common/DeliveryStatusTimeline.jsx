import { DELIVERY_STATUS } from '../../utils/constants';
import { DateTime } from 'luxon';

const DeliveryStatusTimeline = ({ delivery, statusHistory = [] }) => {
  if (!delivery) return null;

  const timelineEvents = [
    {
      status: DELIVERY_STATUS.ASSIGNED,
      title: 'Delivery Assigned',
      description: 'Delivery assigned to driver',
      icon: 'bi-person-check',
      color: 'primary'
    },
    {
      status: DELIVERY_STATUS.IN_TRANSIT,
      title: 'Out for Delivery',
      description: 'Driver started the delivery',
      icon: 'bi-truck',
      color: 'warning'
    },
    {
      status: DELIVERY_STATUS.DELIVERED,
      title: 'Delivered',
      description: 'Successfully delivered to customer',
      icon: 'bi-check-circle',
      color: 'success'
    }
  ];

  // Add failed/delayed status if applicable
  if (delivery.status === DELIVERY_STATUS.FAILED) {
    timelineEvents.push({
      status: DELIVERY_STATUS.FAILED,
      title: 'Delivery Failed',
      description: 'Delivery could not be completed',
      icon: 'bi-x-circle',
      color: 'danger'
    });
  } else if (delivery.status === DELIVERY_STATUS.DELAYED) {
    timelineEvents.push({
      status: DELIVERY_STATUS.DELAYED,
      title: 'Delivery Delayed',
      description: 'Delivery has been delayed',
      icon: 'bi-clock',
      color: 'warning'
    });
  }

  const getCurrentEventIndex = () => {
    return timelineEvents.findIndex(event => event.status === delivery.status);
  };

  const getEventTimestamp = (status) => {
    // Check status history first
    const historyItem = statusHistory.find(item => item.status === status);
    if (historyItem) {
      return historyItem.timestamp;
    }

    // Fall back to delivery object properties
    switch (status) {
      case DELIVERY_STATUS.ASSIGNED:
        return delivery.assignedAt;
      case DELIVERY_STATUS.IN_TRANSIT:
        return delivery.startTime;
      case DELIVERY_STATUS.DELIVERED:
        return delivery.completedAt;
      case DELIVERY_STATUS.FAILED:
        return delivery.failedAt;
      case DELIVERY_STATUS.DELAYED:
        return delivery.delayedAt;
      default:
        return null;
    }
  };

  const isEventCompleted = (eventIndex) => {
    const currentIndex = getCurrentEventIndex();
    
    // Special handling for failed/delayed status
    if (delivery.status === DELIVERY_STATUS.FAILED || delivery.status === DELIVERY_STATUS.DELAYED) {
      // Show all previous steps as completed, and the current failure/delay step
      const event = timelineEvents[eventIndex];
      if (event.status === delivery.status) return true;
      
      // For failed/delayed, show assigned and in_transit as completed if they happened
      if (event.status === DELIVERY_STATUS.ASSIGNED) return true;
      if (event.status === DELIVERY_STATUS.IN_TRANSIT && getEventTimestamp(DELIVERY_STATUS.IN_TRANSIT)) return true;
      
      return false;
    }

    return eventIndex <= currentIndex;
  };

  const isEventActive = (eventIndex) => {
    return eventIndex === getCurrentEventIndex();
  };

  return (
    <div className="delivery-status-timeline">
      <div className="timeline">
        {timelineEvents.map((event, index) => {
          const isCompleted = isEventCompleted(index);
          const isActive = isEventActive(index);
          const timestamp = getEventTimestamp(event.status);

          // Don't show events that haven't occurred and aren't the next step
          if (!isCompleted && !isActive) return null;

          return (
            <div 
              key={event.status}
              className={`timeline-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
            >
              <div className={`timeline-marker bg-${event.color} ${isActive ? 'pulse' : ''}`}>
                <i className={`bi ${event.icon} text-white`}></i>
              </div>
              
              <div className="timeline-content">
                <div className="timeline-header d-flex justify-content-between align-items-start">
                  <h6 className={`mb-1 ${isActive ? `text-${event.color}` : ''}`}>
                    {event.title}
                  </h6>
                  {timestamp && (
                    <small className="text-muted">
                      {DateTime.fromISO(timestamp).toFormat('MMM dd, hh:mm a')}
                    </small>
                  )}
                </div>
                
                <p className="mb-1 text-muted small">
                  {event.description}
                </p>

                {/* Additional details for specific statuses */}
                {event.status === DELIVERY_STATUS.ASSIGNED && delivery.driverName && (
                  <p className="mb-0 small">
                    <strong>Driver:</strong> {delivery.driverName}
                  </p>
                )}
                
                {event.status === DELIVERY_STATUS.IN_TRANSIT && delivery.estimatedDeliveryTime && (
                  <p className="mb-0 small">
                    <strong>ETA:</strong> {DateTime.fromISO(delivery.estimatedDeliveryTime).toFormat('hh:mm a')}
                  </p>
                )}
                
                {event.status === DELIVERY_STATUS.DELIVERED && (
                  <div className="small">
                    {delivery.deliveredTo && (
                      <p className="mb-0">
                        <strong>Delivered to:</strong> {delivery.deliveredTo}
                      </p>
                    )}
                    {delivery.signature && (
                      <p className="mb-0">
                        <strong>Signature:</strong> {delivery.signature}
                      </p>
                    )}
                  </div>
                )}

                {(event.status === DELIVERY_STATUS.FAILED || event.status === DELIVERY_STATUS.DELAYED) && delivery.notes && (
                  <div className="alert alert-light border mt-2 mb-0">
                    <small>
                      <strong>Note:</strong> {delivery.notes}
                    </small>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current status summary */}
      <div className="mt-4">
        <div className={`alert alert-${
          delivery.status === DELIVERY_STATUS.DELIVERED ? 'success' :
          delivery.status === DELIVERY_STATUS.FAILED ? 'danger' :
          delivery.status === DELIVERY_STATUS.DELAYED ? 'warning' :
          'info'
        } d-flex align-items-center`}>
          <i className={`bi ${
            delivery.status === DELIVERY_STATUS.DELIVERED ? 'bi-check-circle' :
            delivery.status === DELIVERY_STATUS.FAILED ? 'bi-x-circle' :
            delivery.status === DELIVERY_STATUS.DELAYED ? 'bi-clock' :
            'bi-info-circle'
          } me-2 fs-5`}></i>
          
          <div>
            <strong>
              Current Status: {timelineEvents.find(e => e.status === delivery.status)?.title || delivery.status}
            </strong>
            
            {delivery.status === DELIVERY_STATUS.IN_TRANSIT && delivery.estimatedDeliveryTime && (
              <div className="small mt-1">
                Estimated delivery time: {DateTime.fromISO(delivery.estimatedDeliveryTime).toFormat('hh:mm a')}
              </div>
            )}
            
            {delivery.status === DELIVERY_STATUS.DELIVERED && (
              <div className="small mt-1">
                Order successfully delivered on {DateTime.fromISO(delivery.completedAt).toFormat('MMM dd, yyyy hh:mm a')}
              </div>
            )}

            {(delivery.status === DELIVERY_STATUS.FAILED || delivery.status === DELIVERY_STATUS.DELAYED) && (
              <div className="small mt-1">
                Please contact customer service for assistance
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact info for active deliveries */}
      {delivery.status === DELIVERY_STATUS.IN_TRANSIT && (delivery.driverName || delivery.driverPhone) && (
        <div className="card mt-3">
          <div className="card-header">
            <h6 className="mb-0">
              <i className="bi bi-person-badge me-2"></i>
              Driver Information
            </h6>
          </div>
          <div className="card-body">
            {delivery.driverName && (
              <p className="mb-1">
                <strong>Name:</strong> {delivery.driverName}
              </p>
            )}
            {delivery.driverPhone && (
              <p className="mb-0">
                <strong>Phone:</strong> 
                <a href={`tel:${delivery.driverPhone}`} className="ms-2 btn btn-sm btn-outline-primary">
                  <i className="bi bi-telephone me-1"></i>
                  {delivery.driverPhone}
                </a>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryStatusTimeline;
