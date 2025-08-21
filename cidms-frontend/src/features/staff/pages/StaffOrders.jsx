import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from '../../orders/api';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import SearchInput from '../../../components/common/SearchInput';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { ORDER_STATUS } from '../../../utils/constants';
import { DateTime } from 'luxon';

const StaffOrders = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState([ORDER_STATUS.CONFIRMED, ORDER_STATUS.PROCESSING].join(','));
  const [actionOrder, setActionOrder] = useState(null);
  const [actionType, setActionType] = useState(null);

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading, error, refetch } = useGetOrdersQuery({
    page,
    limit: 10,
    search,
    status: statusFilter,
  });

  const [updateOrderStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();

  const columns = [
    {
      key: 'orderNumber',
      label: 'Order #',
      render: (order) => (
        <button
          className="btn btn-link p-0 text-primary fw-bold"
          onClick={() => navigate(`/staff/orders/${order.id}`)}
        >
          #{order.orderNumber}
        </button>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (order) => (
        <div>
          <div className="fw-medium">{order.customerName}</div>
          <small className="text-muted">{order.customerEmail}</small>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      render: (order) => (
        <div className="text-center">
          <span className="badge bg-light text-dark border fs-6">
            {order.totalItems}
          </span>
          <div className="small text-muted mt-1">
            ${order.totalAmount?.toFixed(2)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (order) => <StatusBadge status={order.status} type="order" />,
    },
    {
      key: 'orderDate',
      label: 'Order Date',
      render: (order) => (
        <div>
          <div>{DateTime.fromISO(order.orderDate).toFormat('MMM dd, yyyy')}</div>
          <small className="text-muted">
            {DateTime.fromISO(order.orderDate).toFormat('hh:mm a')}
          </small>
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (order) => {
        const isUrgent = order.deliveryDate && 
          DateTime.fromISO(order.deliveryDate) <= DateTime.now().plus({ hours: 4 });
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
      render: (order) => (
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
                onClick={() => navigate(`/staff/orders/${order.id}`)}
              >
                <i className="bi bi-eye me-2"></i>
                View Details
              </button>
            </li>
            <li><hr className="dropdown-divider" /></li>
            {order.status === ORDER_STATUS.CONFIRMED && (
              <li>
                <button
                  className="dropdown-item text-primary"
                  onClick={() => {
                    setActionOrder(order);
                    setActionType('start_preparing');
                  }}
                >
                  <i className="bi bi-play-circle me-2"></i>
                  Start Preparing
                </button>
              </li>
            )}
            {order.status === ORDER_STATUS.PROCESSING && (
              <li>
                <button
                  className="dropdown-item text-success"
                  onClick={() => {
                    setActionOrder(order);
                    setActionType('mark_ready');
                  }}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Mark Ready for Dispatch
                </button>
              </li>
            )}
          </ul>
        </div>
      ),
    },
  ];

  const handleStatusUpdate = async () => {
    if (!actionOrder || !actionType) return;

    const statusMap = {
      start_preparing: ORDER_STATUS.PROCESSING,
      mark_ready: ORDER_STATUS.READY_FOR_DELIVERY,
    };

    const newStatus = statusMap[actionType];
    if (!newStatus) return;

    try {
      await updateOrderStatus({
        id: actionOrder.id,
        status: newStatus,
        notes: actionType === 'start_preparing' 
          ? 'Staff started preparing order' 
          : 'Order marked ready for dispatch by staff',
      }).unwrap();

      enqueueSnackbar(
        actionType === 'start_preparing' 
          ? 'Order preparation started' 
          : 'Order marked ready for dispatch',
        { variant: 'success' }
      );

      setActionOrder(null);
      setActionType(null);
      refetch();
    } catch (error) {
      enqueueSnackbar('Failed to update order status', { variant: 'error' });
    }
  };

  const statusOptions = [
    { value: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PROCESSING].join(','), label: 'Orders to Prepare' },
    { value: ORDER_STATUS.CONFIRMED, label: 'Confirmed Orders' },
    { value: ORDER_STATUS.PROCESSING, label: 'Being Prepared' },
    { value: ORDER_STATUS.READY_FOR_DELIVERY, label: 'Ready for Delivery' },
  ];

  const getActionTitle = () => {
    if (actionType === 'start_preparing') return 'Start Preparing Order';
    if (actionType === 'mark_ready') return 'Mark Ready for Dispatch';
    return 'Update Order';
  };

  const getActionMessage = () => {
    if (actionType === 'start_preparing') {
      return `Start preparing order #${actionOrder?.orderNumber}? This will change the status to "Processing".`;
    }
    if (actionType === 'mark_ready') {
      return `Mark order #${actionOrder?.orderNumber} as ready for dispatch? This will update inventory and prepare the order for delivery assignment.`;
    }
    return 'Are you sure you want to perform this action?';
  };

  return (
    <div className="staff-orders">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Staff Orders</h1>
        <button
          className="btn btn-outline-secondary"
          onClick={refetch}
          disabled={isLoading}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by order number or customer name..."
              />
            </div>
            <div className="col-md-4">
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
            <div className="col-md-2">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearch('');
                  setStatusFilter([ORDER_STATUS.CONFIRMED, ORDER_STATUS.PROCESSING].join(','));
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

      {/* Quick Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25">
            <div className="card-body text-center py-3">
              <i className="bi bi-hourglass-split text-primary fs-4"></i>
              <h6 className="mt-2 mb-1">Confirmed Orders</h6>
              <p className="text-muted mb-0 small">Ready to start preparing</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-warning bg-opacity-10 border-warning border-opacity-25">
            <div className="card-body text-center py-3">
              <i className="bi bi-gear text-warning fs-4"></i>
              <h6 className="mt-2 mb-1">In Preparation</h6>
              <p className="text-muted mb-0 small">Currently being prepared</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-success bg-opacity-10 border-success border-opacity-25">
            <div className="card-body text-center py-3">
              <i className="bi bi-check-circle text-success fs-4"></i>
              <h6 className="mt-2 mb-1">Ready for Dispatch</h6>
              <p className="text-muted mb-0 small">Ready for delivery assignment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
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
        onRowClick={(order) => navigate(`/staff/orders/${order.id}`)}
      />

      {/* Action Confirmation Dialog */}
      <ConfirmDialog
        open={!!actionOrder}
        title={getActionTitle()}
        message={getActionMessage()}
        onConfirm={handleStatusUpdate}
        onCancel={() => {
          setActionOrder(null);
          setActionType(null);
        }}
        confirmText={actionType === 'start_preparing' ? 'Start Preparing' : 'Mark Ready'}
        confirmVariant={actionType === 'start_preparing' ? 'primary' : 'success'}
        loading={isUpdatingStatus}
      />
    </div>
  );
};

export default StaffOrders;
