import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useGetOrdersQuery, useCancelOrderMutation, useUpdateOrderStatusMutation } from '../api';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import SearchInput from '../../../components/common/SearchInput';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { ORDER_STATUS } from '../../../utils/constants';
import { DateTime } from 'luxon';

const OrdersList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelId, setCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading, error, refetch } = useGetOrdersQuery({
    page,
    limit: 10,
    search,
    status: statusFilter,
  });

  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
  const [updateOrderStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();

  const columns = [
    {
      key: 'orderNumber',
      label: 'Order #',
      render: (order) => (
        <button
          className="btn btn-link p-0 text-primary fw-bold"
          onClick={() => handleRowClick(order)}
        >
          #{order.orderNumber}
        </button>
      ),
    },
    {
      key: 'customerName',
      label: 'Customer',
      render: (order) => (
        <div>
          <div className="fw-medium">{order.customerName}</div>
          {order.customerEmail && (
            <small className="text-muted">{order.customerEmail}</small>
          )}
        </div>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      render: (order) => (
        <div className="text-end">
          <div className="fw-bold">${order.totalAmount?.toFixed(2)}</div>
          <small className="text-muted">{order.totalItems} items</small>
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
      key: 'deliveryDate',
      label: 'Delivery',
      render: (order) => {
        if (!order.deliveryDate) return <span className="text-muted">TBD</span>;
        return (
          <div>
            <div>{DateTime.fromISO(order.deliveryDate).toFormat('MMM dd, yyyy')}</div>
            {order.deliveryTimeSlot && (
              <small className="text-muted">{order.deliveryTimeSlot}</small>
            )}
          </div>
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
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <i className="bi bi-eye me-2"></i>
                View Details
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                onClick={() => navigate(`/orders/${order.id}/edit`)}
                disabled={order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.CANCELLED}
              >
                <i className="bi bi-pencil me-2"></i>
                Edit Order
              </button>
            </li>
            <li><hr className="dropdown-divider" /></li>
            {order.status === ORDER_STATUS.PENDING && (
              <li>
                <button
                  className="dropdown-item text-success"
                  onClick={() => handleStatusUpdate(order.id, ORDER_STATUS.CONFIRMED)}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Confirm Order
                </button>
              </li>
            )}
            {(order.status === ORDER_STATUS.CONFIRMED || order.status === ORDER_STATUS.PROCESSING) && (
              <li>
                <button
                  className="dropdown-item text-info"
                  onClick={() => handleStatusUpdate(order.id, ORDER_STATUS.READY_FOR_DELIVERY)}
                >
                  <i className="bi bi-box me-2"></i>
                  Mark Ready
                </button>
              </li>
            )}
            {order.status !== ORDER_STATUS.DELIVERED && order.status !== ORDER_STATUS.CANCELLED && (
              <li>
                <button
                  className="dropdown-item text-danger"
                  onClick={() => setCancelId(order.id)}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Cancel Order
                </button>
              </li>
            )}
          </ul>
        </div>
      ),
    },
  ];

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await updateOrderStatus({
        id: orderId,
        status,
        notes: `Status updated to ${status}`,
      }).unwrap();
      
      enqueueSnackbar('Order status updated successfully', { variant: 'success' });
      refetch();
    } catch (error) {
      enqueueSnackbar('Failed to update order status', { variant: 'error' });
    }
  };

  const handleCancel = async () => {
    if (!cancelId || !cancelReason.trim()) return;

    try {
      await cancelOrder({
        id: cancelId,
        reason: cancelReason,
      }).unwrap();
      
      enqueueSnackbar('Order cancelled successfully', { variant: 'success' });
      setCancelId(null);
      setCancelReason('');
      refetch();
    } catch (error) {
      enqueueSnackbar('Failed to cancel order', { variant: 'error' });
    }
  };

  const handleRowClick = (order) => {
    navigate(`/orders/${order.id}`);
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: ORDER_STATUS.PENDING, label: 'Pending' },
    { value: ORDER_STATUS.CONFIRMED, label: 'Confirmed' },
    { value: ORDER_STATUS.PROCESSING, label: 'Processing' },
    { value: ORDER_STATUS.READY_FOR_DELIVERY, label: 'Ready for Delivery' },
    { value: ORDER_STATUS.OUT_FOR_DELIVERY, label: 'Out for Delivery' },
    { value: ORDER_STATUS.DELIVERED, label: 'Delivered' },
    { value: ORDER_STATUS.CANCELLED, label: 'Cancelled' },
  ];

  const actions = (
    <div className="d-flex gap-2">
      <button
        className="btn btn-primary"
        onClick={() => navigate('/orders/create')}
      >
        <i className="bi bi-plus-circle me-2"></i>
        New Order
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
  );

  return (
    <div className="orders-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Orders</h1>
        {actions}
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by order number, customer name, or email..."
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
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setPage(1);
                }}
              >
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

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
        onRowClick={handleRowClick}
      />

      {/* Cancel Order Dialog */}
      <ConfirmDialog
        open={!!cancelId}
        title="Cancel Order"
        message="Please provide a reason for cancelling this order:"
        onConfirm={handleCancel}
        onCancel={() => {
          setCancelId(null);
          setCancelReason('');
        }}
        confirmText="Cancel Order"
        confirmVariant="danger"
        loading={isCancelling}
      >
        <div className="form-floating">
          <textarea
            className="form-control"
            id="cancelReason"
            placeholder="Reason for cancellation"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            style={{ height: '100px' }}
          />
          <label htmlFor="cancelReason">Reason for cancellation</label>
        </div>
      </ConfirmDialog>
    </div>
  );
};

export default OrdersList;
