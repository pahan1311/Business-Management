import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useGetOrderQuery, useUpdateOrderStatusMutation } from '../api';
import { useGenerateOrderQRMutation } from '../../qr/api';
import LoadingBlock from '../../../components/common/LoadingBlock';
import ErrorState from '../../../components/common/ErrorState';
import StatusBadge from '../../../components/common/StatusBadge';
import OrderStatusStepper from '../../../components/common/OrderStatusStepper';
import QRCodeBlock from '../../../components/common/QRCodeBlock';
import DeliveryStatusTimeline from '../../../components/common/DeliveryStatusTimeline';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { ORDER_STATUS } from '../../../utils/constants';
import { DateTime } from 'luxon';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState(null);
  const [statusNotes, setStatusNotes] = useState('');

  const { data: order, isLoading, error, refetch } = useGetOrderQuery(id);
  const [updateOrderStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();
  const [generateQR, { isLoading: isGeneratingQR }] = useGenerateOrderQRMutation();

  if (isLoading) return <LoadingBlock text="Loading order details..." />;
  if (error) return <ErrorState onRetry={refetch} message="Failed to load order details" />;
  if (!order) return <ErrorState message="Order not found" />;

  const handleStatusUpdate = async () => {
    if (!statusToUpdate) return;

    try {
      await updateOrderStatus({
        id: order.id,
        status: statusToUpdate,
        notes: statusNotes || `Status updated to ${statusToUpdate}`,
      }).unwrap();

      enqueueSnackbar('Order status updated successfully', { variant: 'success' });
      setStatusToUpdate(null);
      setStatusNotes('');
      refetch();
    } catch (error) {
      enqueueSnackbar('Failed to update order status', { variant: 'error' });
    }
  };

  const handleGenerateQR = async () => {
    try {
      await generateQR({
        orderId: order.id,
        options: { size: 200, includeOrderNumber: true }
      }).unwrap();

      enqueueSnackbar('QR code generated successfully', { variant: 'success' });
      refetch();
    } catch (error) {
      enqueueSnackbar('Failed to generate QR code', { variant: 'error' });
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      [ORDER_STATUS.PENDING]: ORDER_STATUS.CONFIRMED,
      [ORDER_STATUS.CONFIRMED]: ORDER_STATUS.PROCESSING,
      [ORDER_STATUS.PROCESSING]: ORDER_STATUS.READY_FOR_DELIVERY,
      [ORDER_STATUS.READY_FOR_DELIVERY]: ORDER_STATUS.OUT_FOR_DELIVERY,
      [ORDER_STATUS.OUT_FOR_DELIVERY]: ORDER_STATUS.DELIVERED,
    };
    return statusFlow[currentStatus];
  };

  const canUpdateStatus = (status) => {
    return status !== ORDER_STATUS.DELIVERED && status !== ORDER_STATUS.CANCELLED;
  };

  const nextStatus = getNextStatus(order.status);

  return (
    <div className="order-detail">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/admin/orders" className="text-decoration-none">Orders</Link>
              </li>
              <li className="breadcrumb-item active">#{order.orderNumber}</li>
            </ol>
          </nav>
          <h1 className="mb-0">Order #{order.orderNumber}</h1>
          <p className="text-muted mb-0">
            Created {DateTime.fromISO(order.createdAt).toFormat('MMM dd, yyyy \'at\' hh:mm a')}
          </p>
        </div>
        <div className="d-flex gap-2">
          {canUpdateStatus(order.status) && (
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(`/admin/orders/${id}/edit`)}
            >
              <i className="bi bi-pencil me-2"></i>
              Edit Order
            </button>
          )}
          <button
            className="btn btn-outline-primary"
            onClick={() => window.print()}
          >
            <i className="bi bi-printer me-2"></i>
            Print
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column */}
        <div className="col-lg-8">
          {/* Order Status */}
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Order Status</h6>
                <StatusBadge status={order.status} type="order" />
              </div>
            </div>
            <div className="card-body">
              <OrderStatusStepper currentStatus={order.status} />
              {canUpdateStatus(order.status) && nextStatus && (
                <div className="text-center mt-3">
                  <button
                    className="btn btn-success"
                    onClick={() => setStatusToUpdate(nextStatus)}
                  >
                    <i className="bi bi-arrow-right-circle me-2"></i>
                    Mark as {nextStatus.replace('_', ' ')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Order Items</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-center">Quantity</th>
                      <th className="text-end">Unit Price</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="d-flex align-items-center">
                            {item.product?.image && (
                              <img 
                                src={item.product.image} 
                                alt={item.product.name}
                                className="rounded me-3"
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                              />
                            )}
                            <div>
                              <div className="fw-medium">{item.product?.name}</div>
                              <small className="text-muted">SKU: {item.product?.sku}</small>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-light text-dark border">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="text-end">${item.unitPrice?.toFixed(2)}</td>
                        <td className="text-end fw-bold">
                          ${(item.quantity * item.unitPrice)?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Summary */}
              <div className="row justify-content-end">
                <div className="col-md-6">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td>Subtotal:</td>
                        <td className="text-end">${order.subtotal?.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>Tax:</td>
                        <td className="text-end">${order.tax?.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>Delivery Fee:</td>
                        <td className="text-end">${order.deliveryFee?.toFixed(2)}</td>
                      </tr>
                      <tr className="table-active fw-bold">
                        <td>Total:</td>
                        <td className="text-end">${order.totalAmount?.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          {order.delivery && (
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">Delivery Information</h6>
              </div>
              <div className="card-body">
                <DeliveryStatusTimeline 
                  events={order.delivery.events || []}
                  currentStatus={order.delivery.status}
                />
                {order.delivery.driver && (
                  <div className="mt-3 p-3 bg-light rounded">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-person-circle fs-3 text-primary me-3"></i>
                      <div>
                        <div className="fw-medium">{order.delivery.driver.name}</div>
                        <small className="text-muted">
                          {order.delivery.driver.phone} | {order.delivery.driver.vehicle}
                        </small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="col-lg-4">
          {/* Customer Information */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Customer Information</h6>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-person-circle fs-3 text-primary me-3"></i>
                <div>
                  <div className="fw-medium">{order.customer?.name}</div>
                  <small className="text-muted">{order.customer?.email}</small>
                </div>
              </div>
              
              {order.customer?.phone && (
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-telephone me-2 text-muted"></i>
                  <span>{order.customer.phone}</span>
                </div>
              )}

              <div className="d-flex align-items-start mb-2">
                <i className="bi bi-geo-alt me-2 text-muted mt-1"></i>
                <div>
                  <div>{order.deliveryAddress?.street}</div>
                  <div>
                    {order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.zipCode}
                  </div>
                </div>
              </div>

              {order.customer?.id && (
                <div className="mt-3">
                  <Link 
                    to={`/admin/customers/${order.customer.id}`}
                    className="btn btn-outline-primary btn-sm w-100"
                  >
                    <i className="bi bi-person me-2"></i>
                    View Customer Profile
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Order QR Code</h6>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={handleGenerateQR}
                disabled={isGeneratingQR}
              >
                {isGeneratingQR ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <i className="bi bi-arrow-clockwise"></i>
                )}
              </button>
            </div>
            <div className="card-body text-center">
              {order.qrCode ? (
                <QRCodeBlock
                  value={order.qrCode.data}
                  size={200}
                  title={`Order #${order.orderNumber}`}
                  downloadName={`order-${order.orderNumber}-qr`}
                />
              ) : (
                <div className="text-muted py-4">
                  <i className="bi bi-qr-code fs-1"></i>
                  <p className="mt-2">No QR code generated</p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleGenerateQR}
                  >
                    Generate QR Code
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Quick Actions</h6>
            </div>
            <div className="card-body d-grid gap-2">
              {order.status === ORDER_STATUS.CONFIRMED && (
                <button
                  className="btn btn-success"
                  onClick={() => navigate(`/admin/deliveries/create?orderId=${order.id}`)}
                >
                  <i className="bi bi-truck me-2"></i>
                  Create Delivery Task
                </button>
              )}
              
              <button
                className="btn btn-outline-primary"
                onClick={() => navigate(`/admin/tasks/create?orderId=${order.id}`)}
              >
                <i className="bi bi-list-task me-2"></i>
                Create Task
              </button>
              
              <button
                className="btn btn-outline-info"
                onClick={() => navigate(`/admin/orders/${order.id}/duplicate`)}
              >
                <i className="bi bi-files me-2"></i>
                Duplicate Order
              </button>
              
              {canUpdateStatus(order.status) && (
                <button
                  className="btn btn-outline-danger"
                  onClick={() => setStatusToUpdate(ORDER_STATUS.CANCELLED)}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Dialog */}
      <ConfirmDialog
        open={!!statusToUpdate}
        title="Update Order Status"
        message={`Are you sure you want to update the order status to ${statusToUpdate?.replace('_', ' ')}?`}
        onConfirm={handleStatusUpdate}
        onCancel={() => {
          setStatusToUpdate(null);
          setStatusNotes('');
        }}
        confirmText="Update Status"
        loading={isUpdatingStatus}
      >
        <div className="form-floating mt-3">
          <textarea
            className="form-control"
            id="statusNotes"
            placeholder="Optional notes"
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
            style={{ height: '100px' }}
          />
          <label htmlFor="statusNotes">Notes (Optional)</label>
        </div>
      </ConfirmDialog>
    </div>
  );
};

export default OrderDetail;
