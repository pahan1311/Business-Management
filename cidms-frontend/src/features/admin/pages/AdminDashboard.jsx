import { useGetDashboardMetricsQuery } from '../api';
import LoadingBlock from '../../../components/common/LoadingBlock';
import ErrorState from '../../../components/common/ErrorState';
import { formatCurrency, formatNumber } from '../../../utils/format';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { data: metrics, isLoading, error, refetch } = useGetDashboardMetricsQuery();

  if (isLoading) return <LoadingBlock text="Loading dashboard..." />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      {/* KPI Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-primary">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Orders
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {formatNumber(metrics?.orders?.total || 0)}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-bag-fill text-primary" style={{fontSize: '2rem'}}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-success">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Revenue (Today)
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {formatCurrency(metrics?.revenue?.today || 0)}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-currency-dollar text-success" style={{fontSize: '2rem'}}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-warning">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Pending Deliveries
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {formatNumber(metrics?.deliveries?.pending || 0)}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-truck text-warning" style={{fontSize: '2rem'}}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-info">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Active Customers
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {formatNumber(metrics?.customers?.active || 0)}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-people text-info" style={{fontSize: '2rem'}}></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h6 className="m-0 font-weight-bold text-primary">Quick Actions</h6>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link to="/admin/orders/new" className="btn btn-primary">
                  <i className="bi bi-plus-circle me-2"></i>
                  Create New Order
                </Link>
                <Link to="/admin/customers" className="btn btn-outline-primary">
                  <i className="bi bi-people me-2"></i>
                  Manage Customers
                </Link>
                <Link to="/admin/inventory" className="btn btn-outline-primary">
                  <i className="bi bi-box me-2"></i>
                  Check Inventory
                </Link>
                <Link to="/admin/deliveries" className="btn btn-outline-primary">
                  <i className="bi bi-truck me-2"></i>
                  Manage Deliveries
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h6 className="m-0 font-weight-bold text-primary">Low Stock Alert</h6>
            </div>
            <div className="card-body">
              {metrics?.lowStock?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Current Stock</th>
                        <th>Reorder Point</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.lowStock.slice(0, 5).map((item, index) => (
                        <tr key={index}>
                          <td>{item.name}</td>
                          <td>
                            <span className="badge bg-danger">{item.onHand}</span>
                          </td>
                          <td>{item.reorderPoint}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Link to="/admin/inventory?filter=low-stock" className="btn btn-sm btn-outline-danger">
                    View All Low Stock Items
                  </Link>
                </div>
              ) : (
                <p className="text-muted mb-0">All products are sufficiently stocked.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
