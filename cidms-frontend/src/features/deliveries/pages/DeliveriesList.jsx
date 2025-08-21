import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { 
  useGetMyDeliveriesQuery,
  useUpdateDeliveryStatusMutation 
} from '../api';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import SearchInput from '../../../components/common/SearchInput';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { DELIVERY_STATUS } from '../../../utils/constants';
import { DateTime } from 'luxon';

const DeliveriesList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [actionDelivery, setActionDelivery] = useState(null);
  const [actionType, setActionType] = useState(null);

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading, error, refetch } = useGetMyDeliveriesQuery({
    page,
    limit: 10,
    search,
    status: statusFilter,
    date: dateFilter,
  });

  const [updateDeliveryStatus, { isLoading: isUpdatingStatus }] = useUpdateDeliveryStatusMutation();

  const columns = [
    {
      key: 'orderNumber',
      label: 'Order #',
      render: (delivery) => (
        <button
          className="btn btn-link p-0 text-primary fw-bold"
          onClick={() => navigate(`/delivery/deliveries/${delivery.id}`)}
        >
          #{delivery.orderNumber}
        </button>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (delivery) => (
        <div>
          <div className="fw-medium">{delivery.customerName}</div>
          <small className="text-muted">{delivery.customerPhone}</small>
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Delivery Address',
      render: (delivery) => (
        <div>
          <div className="text-truncate" style={{ maxWidth: '200px' }}>
            {delivery.deliveryAddress}
          </div>
          <small className="text-muted">{delivery.deliveryArea}</small>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (delivery) => <StatusBadge status={delivery.status} type="delivery" />,
    },
    {
      key: 'scheduledTime',
      label: 'Scheduled Time',
      render: (delivery) => (
        <div>
          <div>{DateTime.fromISO(delivery.scheduledTime).toFormat('MMM dd, yyyy')}</div>
          <small className="text-muted">
            {DateTime.fromISO(delivery.scheduledTime).toFormat('hh:mm a')}
          </small>
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (delivery) => {
        const isUrgent = delivery.isUrgent || 
          DateTime.fromISO(delivery.scheduledTime) <= DateTime.now().plus({ hours: 2 });
        return isUrgent ? (
          <span className="badge bg-danger">Urgent</span>
        ) : (
          <span className="badge bg-secondary">Normal</span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (delivery) => (
        <div className="dropdown">
          <button
            className="btn btn-sm btn-outline-secondary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
          >
            Actions
          </button>
          <ul className="dropdown-menu">
            <li>
              <button
                className="dropdown-item"
                onClick={() => navigate(`/delivery/deliveries/${delivery.id}`)}
              >
                <i className="bi bi-eye me-2"></i>
                View Details
              </button>
            </li>
            <li><hr className="dropdown-divider" /></li>
            {delivery.status === DELIVERY_STATUS.ASSIGNED && (
              <li>
                <button
                  className="dropdown-item text-primary"
                  onClick={() => {
                    setActionDelivery(delivery);
                    setActionType('start');
                  }}
                >
                  <i className="bi bi-play-circle me-2"></i>
                  Start Delivery
                </button>
              </li>
            )}
            {delivery.status === DELIVERY_STATUS.IN_TRANSIT && (
              <>
                <li>
                  <button
                    className="dropdown-item text-success"
                    onClick={() => navigate(`/delivery/deliveries/${delivery.id}?action=complete`)}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    Complete Delivery
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item text-warning"
                    onClick={() => {
                      setActionDelivery(delivery);
                      setActionType('delay');
                    }}
                  >
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Report Issue
                  </button>
                </li>
              </>
            )}
            <li>
              <button
                className="dropdown-item"
                onClick={() => navigate(`/delivery/route?delivery=${delivery.id}`)}
              >
                <i className="bi bi-map me-2"></i>
                View Route
              </button>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  const handleStatusUpdate = async () => {
    if (!actionDelivery || !actionType) return;

    const statusMap = {
      start: DELIVERY_STATUS.IN_TRANSIT,
      delay: DELIVERY_STATUS.DELAYED,
    };

    const newStatus = statusMap[actionType];
    if (!newStatus) return;

    try {
      await updateDeliveryStatus({
        id: actionDelivery.id,
        status: newStatus,
        timestamp: new Date().toISOString(),
        notes: actionType === 'start' 
          ? 'Delivery started by driver' 
          : 'Delivery delayed - driver reported issue',
      }).unwrap();

      enqueueSnackbar(
        actionType === 'start' 
          ? 'Delivery started' 
          : 'Issue reported',
        { variant: 'success' }
      );

      setActionDelivery(null);
      setActionType(null);
      refetch();
    } catch (error) {
      enqueueSnackbar('Failed to update delivery status', { variant: 'error' });
    }
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: DELIVERY_STATUS.ASSIGNED, label: 'Assigned' },
    { value: DELIVERY_STATUS.IN_TRANSIT, label: 'In Transit' },
    { value: DELIVERY_STATUS.DELIVERED, label: 'Delivered' },
    { value: DELIVERY_STATUS.FAILED, label: 'Failed' },
    { value: DELIVERY_STATUS.DELAYED, label: 'Delayed' },
  ];

  const getActionTitle = () => {
    if (actionType === 'start') return 'Start Delivery';
    if (actionType === 'delay') return 'Report Issue';
    return 'Update Delivery';
  };

  const getActionMessage = () => {
    if (actionType === 'start') {
      return `Start delivery for order #${actionDelivery?.orderNumber}? This will mark the delivery as "In Transit".`;
    }
    if (actionType === 'delay') {
      return `Report an issue with delivery #${actionDelivery?.orderNumber}? This will mark it as delayed and notify the dispatch team.`;
    }
    return 'Are you sure you want to perform this action?';
  };

  return (
    <div className="deliveries-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Deliveries</h1>
        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
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
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25">
            <div className="card-body text-center py-3">
              <i className="bi bi-clipboard-check text-primary fs-4"></i>
              <h6 className="mt-2 mb-1">Assigned</h6>
              <p className="text-muted mb-0 small">Ready for pickup</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning bg-opacity-10 border-warning border-opacity-25">
            <div className="card-body text-center py-3">
              <i className="bi bi-truck text-warning fs-4"></i>
              <h6 className="mt-2 mb-1">In Transit</h6>
              <p className="text-muted mb-0 small">Currently delivering</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success bg-opacity-10 border-success border-opacity-25">
            <div className="card-body text-center py-3">
              <i className="bi bi-check-circle text-success fs-4"></i>
              <h6 className="mt-2 mb-1">Delivered</h6>
              <p className="text-muted mb-0 small">Successfully completed</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger bg-opacity-10 border-danger border-opacity-25">
            <div className="card-body text-center py-3">
              <i className="bi bi-exclamation-triangle text-danger fs-4"></i>
              <h6 className="mt-2 mb-1">Issues</h6>
              <p className="text-muted mb-0 small">Failed or delayed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by order number or customer name..."
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <input
                type="date"
                className="form-control"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setDateFilter('');
                  setPage(1);
                }}
              >
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Deliveries Table */}
      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        error={error}
        pagination={{
          page,
          totalPages: data?.totalPages || 0,
          totalItems: data?.totalItems || 0,
          onPageChange: setPage,
        }}
        onRowClick={(delivery) => navigate(`/delivery/deliveries/${delivery.id}`)}
      />

      {/* Action Confirmation Dialog */}
      <ConfirmDialog
        open={!!actionDelivery}
        title={getActionTitle()}
        message={getActionMessage()}
        onConfirm={handleStatusUpdate}
        onCancel={() => {
          setActionDelivery(null);
          setActionType(null);
        }}
        confirmText={actionType === 'start' ? 'Start Delivery' : 'Report Issue'}
        confirmVariant={actionType === 'start' ? 'primary' : 'warning'}
        loading={isUpdatingStatus}
      />
    </div>
  );
};

export default DeliveriesList;
