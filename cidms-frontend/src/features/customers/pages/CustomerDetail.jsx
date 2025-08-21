import { useParams, Link } from 'react-router-dom';
import { useGetCustomerQuery, useGetCustomerOrdersQuery } from '../api';
import LoadingBlock from '../../../components/common/LoadingBlock';
import ErrorState from '../../../components/common/ErrorState';
import StatusBadge from '../../../components/common/StatusBadge';
import { formatDate, formatPhoneNumber, formatCurrency } from '../../../utils/format';

const CustomerDetail = () => {
  const { id } = useParams();
  
  const { data: customer, isLoading, error, refetch } = useGetCustomerQuery(id);
  const { data: orders, isLoading: ordersLoading } = useGetCustomerOrdersQuery(id);

  if (isLoading) return <LoadingBlock text="Loading customer details..." />;
  if (error) return <ErrorState onRetry={refetch} />;
  if (!customer) return <ErrorState title="Customer not found" />;

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/admin/customers">Customers</Link>
              </li>
              <li className="breadcrumb-item active">{customer.name}</li>
            </ol>
          </nav>
          <h1 className="h3 mb-0">{customer.name}</h1>
        </div>
        <div className="btn-group">
          <Link to={`/admin/customers/${id}/edit`} className="btn btn-primary">
            <i className="bi bi-pencil me-2"></i>
            Edit Customer
          </Link>
          <Link to={`/admin/orders/new?customerId=${id}`} className="btn btn-success">
            <i className="bi bi-plus-circle me-2"></i>
            Create Order
          </Link>
        </div>
      </div>

      <div className="row">
        {/* Customer Info */}
        <div className="col-lg-4 mb-4">
          <div className="card">
            <div className="card-header">
              <h6 className="card-title mb-0">Customer Information</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label text-muted">Name</label>
                <p className="mb-0">{customer.name}</p>
              </div>
              <div className="mb-3">
                <label className="form-label text-muted">Email</label>
                <p className="mb-0">
                  <a href={`mailto:${customer.email}`}>{customer.email}</a>
                </p>
              </div>
              <div className="mb-3">
                <label className="form-label text-muted">Phone</label>
                <p className="mb-0">
                  <a href={`tel:${customer.phone}`}>{formatPhoneNumber(customer.phone)}</a>
                </p>
              </div>
              <div className="mb-3">
                <label className="form-label text-muted">Member Since</label>
                <p className="mb-0">{formatDate(customer.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Default Address */}
          {customer.defaultAddress && (
            <div className="card mt-3">
              <div className="card-header">
                <h6 className="card-title mb-0">Default Address</h6>
              </div>
              <div className="card-body">
                <address className="mb-0">
                  {customer.defaultAddress.line1}<br />
                  {customer.defaultAddress.line2 && (
                    <>{customer.defaultAddress.line2}<br /></>
                  )}
                  {customer.defaultAddress.city}, {customer.defaultAddress.state} {customer.defaultAddress.postalCode}<br />
                  {customer.defaultAddress.country}
                </address>
              </div>
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="col-lg-8 mb-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="card-title mb-0">Recent Orders</h6>
              <Link to={`/admin/orders?customerId=${id}`} className="btn btn-sm btn-outline-primary">
                View All Orders
              </Link>
            </div>
            <div className="card-body">
              {ordersLoading ? (
                <LoadingBlock />
              ) : orders?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 10).map((order) => (
                        <tr key={order.id}>
                          <td>
                            <Link to={`/admin/orders/${order.id}`} className="text-decoration-none">
                              #{order.orderNumber}
                            </Link>
                          </td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>
                            <StatusBadge status={order.status} type="order" />
                          </td>
                          <td>{order.items?.length || 0}</td>
                          <td>{formatCurrency(order.total)}</td>
                          <td>
                            <Link
                              to={`/admin/orders/${order.id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-bag" style={{ fontSize: '2rem' }}></i>
                  <p>No orders found for this customer.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
