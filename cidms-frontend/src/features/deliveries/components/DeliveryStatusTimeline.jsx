import { formatDateTime } from '../../../utils/format';
import { DELIVERY_STATUSES } from '../../../utils/constants';

const DeliveryStatusTimeline = ({ delivery, events = [], className = "" }) => {
  const getStatusConfig = (status) => {
    const configs = {
      [DELIVERY_STATUSES.ASSIGNED]: {
        icon: 'person-check',
        color: 'info',
        title: 'Assigned to Driver'
      },
      [DELIVERY_STATUSES.PICKED_UP]: {
        icon: 'box-arrow-up',
        color: 'primary',
        title: 'Package Picked Up'
      },
      [DELIVERY_STATUSES.OUT_FOR_DELIVERY]: {
        icon: 'truck',
        color: 'warning',
        title: 'Out for Delivery'
      },
      [DELIVERY_STATUSES.DELIVERED]: {
        icon: 'check-circle-fill',
        color: 'success',
        title: 'Delivered'
      },
      [DELIVERY_STATUSES.FAILED]: {
        icon: 'x-circle-fill',
        color: 'danger',
        title: 'Delivery Failed'
      },
      [DELIVERY_STATUSES.CANCELED]: {
        icon: 'x-circle',
        color: 'secondary',
        title: 'Delivery Canceled'
      }
    };

    return configs[status] || {
      icon: 'circle',
      color: 'secondary',
      title: status
    };
  };

  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className={`delivery-status-timeline ${className}`}>
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">Delivery Timeline</h6>
        </div>
        <div className="card-body">
          {sortedEvents.length === 0 ? (
            <div className="text-center text-muted py-4">
              <i className="bi bi-clock-history" style={{ fontSize: '2rem' }}></i>
              <p className="mt-2 mb-0">No timeline events yet</p>
            </div>
          ) : (
            <div className="timeline">
              {sortedEvents.map((event, index) => {
                const config = getStatusConfig(event.status);
                const isLatest = index === 0;
                
                return (
                  <div 
                    key={`${event.id || index}-${event.createdAt}`} 
                    className={`timeline-item ${isLatest ? 'latest' : ''}`}
                  >
                    <div className="d-flex align-items-start">
                      <div className="flex-shrink-0 me-3">
                        <div 
                          className={`rounded-circle d-flex align-items-center justify-content-center bg-${config.color} text-white`}
                          style={{ width: '40px', height: '40px' }}
                        >
                          <i className={`bi bi-${config.icon}`}></i>
                        </div>
                      </div>
                      
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">{config.title}</h6>
                            {event.message && (
                              <p className="text-muted mb-1 small">{event.message}</p>
                            )}
                            {event.location && (
                              <p className="text-muted mb-1 small">
                                <i className="bi bi-geo-alt me-1"></i>
                                {event.location}
                              </p>
                            )}
                            {event.driver && (
                              <p className="text-muted mb-1 small">
                                <i className="bi bi-person me-1"></i>
                                Driver: {event.driver.name}
                              </p>
                            )}
                          </div>
                          <small className="text-muted">
                            {formatDateTime(event.createdAt)}
                          </small>
                        </div>
                        
                        {event.photos && event.photos.length > 0 && (
                          <div className="mt-2">
                            <div className="row g-2">
                              {event.photos.slice(0, 3).map((photo, photoIndex) => (
                                <div key={photoIndex} className="col-4">
                                  <img 
                                    src={photo.url} 
                                    alt={`Event photo ${photoIndex + 1}`}
                                    className="img-fluid rounded"
                                    style={{ maxHeight: '80px', objectFit: 'cover', width: '100%' }}
                                  />
                                </div>
                              ))}
                              {event.photos.length > 3 && (
                                <div className="col-4">
                                  <div 
                                    className="d-flex align-items-center justify-content-center bg-light rounded"
                                    style={{ height: '80px' }}
                                  >
                                    <small className="text-muted">
                                      +{event.photos.length - 3} more
                                    </small>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {event.signature && (
                          <div className="mt-2">
                            <small className="text-muted d-block">Signature received</small>
                            <img 
                              src={event.signature.url} 
                              alt="Delivery signature"
                              className="img-fluid rounded mt-1"
                              style={{ maxHeight: '60px' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Current Status Summary */}
          {delivery && (
            <div className="border-top pt-3 mt-3">
              <div className="row align-items-center">
                <div className="col">
                  <strong>Current Status:</strong>
                  <span className={`ms-2 badge bg-${getStatusConfig(delivery.status).color}`}>
                    {getStatusConfig(delivery.status).title}
                  </span>
                </div>
                {delivery.estimatedDelivery && (
                  <div className="col-auto">
                    <small className="text-muted">
                      <i className="bi bi-clock me-1"></i>
                      Est. Delivery: {formatDateTime(delivery.estimatedDelivery)}
                    </small>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryStatusTimeline;
