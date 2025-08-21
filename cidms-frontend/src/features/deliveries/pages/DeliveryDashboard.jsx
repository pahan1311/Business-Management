import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { 
  useGetMyDeliveriesQuery,
  useUpdateDeliveryStatusMutation 
} from '../api';
import StatusBadge from '../../../components/common/StatusBadge';
import { DELIVERY_STATUS } from '../../../utils/constants';
import { DateTime } from 'luxon';

const DeliveryDashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const { data: todayDeliveries, isLoading, refetch } = useGetMyDeliveriesQuery({
    date: new Date().toISOString().split('T')[0],
    status: [DELIVERY_STATUS.ASSIGNED, DELIVERY_STATUS.IN_TRANSIT].join(','),
  });

  const [updateDeliveryStatus] = useUpdateDeliveryStatusMutation();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      setRefreshKey(prev => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const handleQuickStatusUpdate = async (deliveryId, newStatus) => {
    try {
      await updateDeliveryStatus({
        id: deliveryId,
        status: newStatus,
        timestamp: new Date().toISOString(),
      }).unwrap();

      enqueueSnackbar('Delivery status updated', { variant: 'success' });
      refetch();
    } catch (error) {
      enqueueSnackbar('Failed to update status', { variant: 'error' });
    }
  };

  const getStatusCounts = () => {
    const deliveries = todayDeliveries?.data || [];
    return {
      assigned: deliveries.filter(d => d.status === DELIVERY_STATUS.ASSIGNED).length,
      inTransit: deliveries.filter(d => d.status === DELIVERY_STATUS.IN_TRANSIT).length,
      delivered: deliveries.filter(d => d.status === DELIVERY_STATUS.DELIVERED).length,
      total: deliveries.length,
    };
  };

  const stats = getStatusCounts();
  const upcomingDeliveries = (todayDeliveries?.data || [])
    .filter(d => d.status === DELIVERY_STATUS.ASSIGNED)
    .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime))
    .slice(0, 5);

  const activeDeliveries = (todayDeliveries?.data || [])
    .filter(d => d.status === DELIVERY_STATUS.IN_TRANSIT)
    .slice(0, 3);

  return (
    <div className="delivery-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Delivery Dashboard</h1>
          <p className="text-muted mb-0">
            Welcome back! Here's your delivery overview for today.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate('/delivery/scan')}
          >
            <i className="bi bi-qr-code-scan me-2"></i>
            QR Scanner
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={refetch}
            disabled={isLoading}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25">
            <div className="card-body text-center">
              <i className="bi bi-clipboard-check text-primary fs-1 mb-2"></i>
              <h3 className="text-primary mb-1">{stats.assigned}</h3>
              <p className="mb-0">Assigned Deliveries</p>
              <small className="text-muted">Ready for pickup</small>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-warning bg-opacity-10 border-warning border-opacity-25">
            <div className="card-body text-center">
              <i className="bi bi-truck text-warning fs-1 mb-2"></i>
              <h3 className="text-warning mb-1">{stats.inTransit}</h3>
              <p className="mb-0">In Transit</p>
              <small className="text-muted">Currently delivering</small>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-success bg-opacity-10 border-success border-opacity-25">
            <div className="card-body text-center">
              <i className="bi bi-check-circle text-success fs-1 mb-2"></i>
              <h3 className="text-success mb-1">{stats.delivered}</h3>
              <p className="mb-0">Delivered Today</p>
              <small className="text-muted">Successfully completed</small>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-info bg-opacity-10 border-info border-opacity-25">
            <div className="card-body text-center">
              <i className="bi bi-calendar-day text-info fs-1 mb-2"></i>
              <h3 className="text-info mb-1">{stats.total}</h3>
              <p className="mb-0">Total Today</p>
              <small className="text-muted">All deliveries assigned</small>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Upcoming Deliveries */}
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-clock me-2"></i>
                Upcoming Deliveries
              </h5>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate('/delivery/deliveries')}
              >
                View All
              </button>
            </div>
            <div className="card-body">
              {upcomingDeliveries.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-check-all text-success fs-1 mb-3"></i>
                  <h6>All caught up!</h6>
                  <p className="text-muted mb-0">No upcoming deliveries at the moment.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {upcomingDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="list-group-item d-flex justify-content-between align-items-start px-0"
                    >
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <h6 className="mb-1">Order #{delivery.orderNumber}</h6>
                          <StatusBadge status={delivery.status} type="delivery" />
                        </div>
                        <p className="mb-1 text-muted">
                          <i className="bi bi-person me-1"></i>
                          {delivery.customerName}
                        </p>
                        <p className="mb-1 text-muted">
                          <i className="bi bi-geo-alt me-1"></i>
                          {delivery.deliveryAddress}
                        </p>
                        <small className="text-muted">
                          <i className="bi bi-clock me-1"></i>
                          Scheduled: {DateTime.fromISO(delivery.scheduledTime).toFormat('hh:mm a')}
                        </small>
                      </div>
                      <div className="ms-3">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleQuickStatusUpdate(delivery.id, DELIVERY_STATUS.IN_TRANSIT)}
                        >
                          Start
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Deliveries */}
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-truck me-2"></i>
                Active Deliveries
              </h5>
            </div>
            <div className="card-body">
              {activeDeliveries.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-truck text-muted fs-1 mb-3"></i>
                  <h6>No Active Deliveries</h6>
                  <p className="text-muted mb-0">Start a delivery to see it here.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {activeDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="list-group-item px-0 border-start border-warning border-3"
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-1">Order #{delivery.orderNumber}</h6>
                        <StatusBadge status={delivery.status} type="delivery" />
                      </div>
                      <p className="mb-1 text-muted small">
                        <i className="bi bi-person me-1"></i>
                        {delivery.customerName}
                      </p>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <small className="text-muted">
                          Started: {DateTime.fromISO(delivery.startTime).toFormat('hh:mm a')}
                        </small>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => navigate(`/delivery/deliveries/${delivery.id}`)}
                        >
                          Complete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row g-4 mt-2">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-lightning me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={() => navigate('/delivery/deliveries')}
                  >
                    <i className="bi bi-list-ul d-block fs-4 mb-2"></i>
                    View All Deliveries
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-success w-100"
                    onClick={() => navigate('/delivery/scan')}
                  >
                    <i className="bi bi-qr-code-scan d-block fs-4 mb-2"></i>
                    QR Code Scanner
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-info w-100"
                    onClick={() => navigate('/delivery/route')}
                  >
                    <i className="bi bi-map d-block fs-4 mb-2"></i>
                    Delivery Routes
                  </button>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-warning w-100"
                    onClick={() => navigate('/delivery/reports')}
                  >
                    <i className="bi bi-graph-up d-block fs-4 mb-2"></i>
                    My Reports
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
