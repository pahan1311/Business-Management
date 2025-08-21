import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { DateTime } from 'luxon';
import LoadingBlock from '../../../components/common/LoadingBlock';
import ErrorState from '../../../components/common/ErrorState';

const ReportsList = () => {
  const [dateRange, setDateRange] = useState({
    startDate: DateTime.now().startOf('month').toISODate(),
    endDate: DateTime.now().toISODate(),
  });
  const [exportLoading, setExportLoading] = useState({});

  const { enqueueSnackbar } = useSnackbar();

  const reports = [
    {
      id: 'sales-summary',
      title: 'Sales Summary',
      description: 'Overview of sales performance including revenue, orders, and trends',
      icon: 'graph-up',
      color: 'primary',
      endpoint: '/reports/sales-summary',
    },
    {
      id: 'inventory-report',
      title: 'Inventory Report',
      description: 'Current stock levels, low stock alerts, and movement history',
      icon: 'boxes',
      color: 'success',
      endpoint: '/reports/inventory',
    },
    {
      id: 'delivery-performance',
      title: 'Delivery Performance',
      description: 'Delivery metrics, on-time rates, and driver performance',
      icon: 'truck',
      color: 'warning',
      endpoint: '/reports/delivery-performance',
    },
    {
      id: 'customer-analytics',
      title: 'Customer Analytics',
      description: 'Customer behavior, order patterns, and retention metrics',
      icon: 'people',
      color: 'info',
      endpoint: '/reports/customer-analytics',
    },
    {
      id: 'financial-report',
      title: 'Financial Report',
      description: 'Revenue, costs, profit margins, and financial trends',
      icon: 'currency-dollar',
      color: 'success',
      endpoint: '/reports/financial',
    },
    {
      id: 'inquiry-report',
      title: 'Inquiry Report',
      description: 'Customer inquiries, response times, and resolution metrics',
      icon: 'chat-dots',
      color: 'secondary',
      endpoint: '/reports/inquiries',
    },
  ];

  const handleExportReport = async (report, format = 'csv') => {
    const loadingKey = `${report.id}-${format}`;
    setExportLoading(prev => ({ ...prev, [loadingKey]: true }));

    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format,
      });

      const response = await fetch(`${report.endpoint}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.id}-${dateRange.startDate}-to-${dateRange.endDate}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      enqueueSnackbar(`${report.title} exported successfully`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(`Failed to export ${report.title}`, { variant: 'error' });
    } finally {
      setExportLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const isValidDateRange = dateRange.startDate && dateRange.endDate && 
    DateTime.fromISO(dateRange.startDate) <= DateTime.fromISO(dateRange.endDate);

  return (
    <div className="reports-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Reports</h1>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary">
            <i className="bi bi-clock-history me-2"></i>
            Scheduled Reports
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end g-3">
            <div className="col-md-3">
              <label htmlFor="startDate" className="form-label">Start Date</label>
              <input
                type="date"
                id="startDate"
                className="form-control"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="endDate" className="form-label">End Date</label>
              <input
                type="date"
                id="endDate"
                className="form-control"
                value={dateRange.endDate}
                max={DateTime.now().toISODate()}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="col-md-6">
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setDateRange({
                    startDate: DateTime.now().startOf('week').toISODate(),
                    endDate: DateTime.now().toISODate(),
                  })}
                >
                  This Week
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setDateRange({
                    startDate: DateTime.now().startOf('month').toISODate(),
                    endDate: DateTime.now().toISODate(),
                  })}
                >
                  This Month
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setDateRange({
                    startDate: DateTime.now().minus({ months: 3 }).startOf('day').toISODate(),
                    endDate: DateTime.now().toISODate(),
                  })}
                >
                  Last 3 Months
                </button>
              </div>
            </div>
          </div>
          {!isValidDateRange && (
            <div className="alert alert-warning mt-3 mb-0">
              <i className="bi bi-exclamation-triangle me-2"></i>
              Please select a valid date range
            </div>
          )}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="row g-4">
        {reports.map((report) => (
          <div key={report.id} className="col-lg-6">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex align-items-start mb-3">
                  <div className={`rounded-circle p-2 bg-${report.color} bg-opacity-10 me-3`}>
                    <i className={`bi bi-${report.icon} text-${report.color} fs-4`}></i>
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="card-title mb-1">{report.title}</h5>
                    <p className="card-text text-muted small mb-0">{report.description}</p>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <div className="dropdown">
                    <button
                      className={`btn btn-${report.color} dropdown-toggle`}
                      type="button"
                      data-bs-toggle="dropdown"
                      disabled={!isValidDateRange}
                    >
                      <i className="bi bi-download me-2"></i>
                      Export
                    </button>
                    <ul className="dropdown-menu">
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => handleExportReport(report, 'csv')}
                          disabled={exportLoading[`${report.id}-csv`]}
                        >
                          <i className="bi bi-filetype-csv me-2"></i>
                          CSV Format
                          {exportLoading[`${report.id}-csv`] && (
                            <span className="spinner-border spinner-border-sm ms-2"></span>
                          )}
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => handleExportReport(report, 'xlsx')}
                          disabled={exportLoading[`${report.id}-xlsx`]}
                        >
                          <i className="bi bi-filetype-xlsx me-2"></i>
                          Excel Format
                          {exportLoading[`${report.id}-xlsx`] && (
                            <span className="spinner-border spinner-border-sm ms-2"></span>
                          )}
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => handleExportReport(report, 'pdf')}
                          disabled={exportLoading[`${report.id}-pdf`]}
                        >
                          <i className="bi bi-filetype-pdf me-2"></i>
                          PDF Format
                          {exportLoading[`${report.id}-pdf`] && (
                            <span className="spinner-border spinner-border-sm ms-2"></span>
                          )}
                        </button>
                      </li>
                    </ul>
                  </div>

                  <button
                    className={`btn btn-outline-${report.color}`}
                    disabled={!isValidDateRange}
                    onClick={() => {
                      // Navigate to detailed report view (can be implemented later)
                      enqueueSnackbar('Detailed view coming soon', { variant: 'info' });
                    }}
                  >
                    <i className="bi bi-eye me-2"></i>
                    View Details
                  </button>
                </div>
              </div>

              <div className="card-footer bg-light">
                <small className="text-muted">
                  <i className="bi bi-calendar me-1"></i>
                  Data range: {DateTime.fromISO(dateRange.startDate).toFormat('MMM dd')} - {DateTime.fromISO(dateRange.endDate).toFormat('MMM dd, yyyy')}
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats Cards */}
      <div className="row g-4 mt-2">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="bi bi-speedometer2 me-2"></i>
                Quick Statistics
              </h6>
            </div>
            <div className="card-body">
              <div className="row g-4 text-center">
                <div className="col-md-3">
                  <div className="text-primary">
                    <i className="bi bi-graph-up fs-1"></i>
                    <h4 className="mt-2 mb-1">--</h4>
                    <p className="text-muted mb-0">Total Revenue</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-success">
                    <i className="bi bi-box-seam fs-1"></i>
                    <h4 className="mt-2 mb-1">--</h4>
                    <p className="text-muted mb-0">Orders Completed</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-warning">
                    <i className="bi bi-truck fs-1"></i>
                    <h4 className="mt-2 mb-1">--</h4>
                    <p className="text-muted mb-0">Deliveries Made</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-info">
                    <i className="bi bi-people fs-1"></i>
                    <h4 className="mt-2 mb-1">--</h4>
                    <p className="text-muted mb-0">Active Customers</p>
                  </div>
                </div>
              </div>
              <div className="text-center mt-3">
                <small className="text-muted">
                  Statistics will be calculated based on your selected date range
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsList;
