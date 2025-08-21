import { useState } from 'react';
import { DateTime } from 'luxon';
import DataTable from '../../../components/common/DataTable';
import SearchInput from '../../../components/common/SearchInput';

const AuditLogs = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    actor: '',
    entity: '',
    action: '',
    startDate: DateTime.now().minus({ days: 7 }).toISODate(),
    endDate: DateTime.now().toISODate(),
  });

  // Mock data - in real app this would come from API
  const mockData = {
    data: [
      {
        id: '1',
        timestamp: '2025-08-21T10:30:00Z',
        actor: { name: 'John Admin', email: 'john@admin.com', role: 'ADMIN' },
        action: 'CREATE',
        entity: 'Order',
        entityId: 'ORD-001',
        details: 'Created new order for customer Jane Doe',
        ip: '192.168.1.1',
        userAgent: 'Chrome/91.0.4472.124',
      },
      {
        id: '2',
        timestamp: '2025-08-21T10:25:00Z',
        actor: { name: 'Sarah Staff', email: 'sarah@staff.com', role: 'STAFF' },
        action: 'UPDATE',
        entity: 'Product',
        entityId: 'PRD-123',
        details: 'Updated product stock from 50 to 75',
        ip: '192.168.1.2',
        userAgent: 'Firefox/89.0',
      },
      {
        id: '3',
        timestamp: '2025-08-21T10:20:00Z',
        actor: { name: 'Mike Driver', email: 'mike@delivery.com', role: 'DELIVERY' },
        action: 'UPDATE',
        entity: 'Delivery',
        entityId: 'DEL-456',
        details: 'Marked delivery as completed',
        ip: '192.168.1.3',
        userAgent: 'Mobile Safari/14.0',
      },
    ],
    totalPages: 5,
    totalItems: 48,
  };

  const columns = [
    {
      key: 'timestamp',
      label: 'Time',
      render: (log) => (
        <div>
          <div>{DateTime.fromISO(log.timestamp).toFormat('MMM dd, yyyy')}</div>
          <small className="text-muted">
            {DateTime.fromISO(log.timestamp).toFormat('hh:mm:ss a')}
          </small>
        </div>
      ),
    },
    {
      key: 'actor',
      label: 'User',
      render: (log) => (
        <div>
          <div className="fw-medium">{log.actor.name}</div>
          <small className="text-muted">{log.actor.email}</small>
          <div>
            <span className={`badge bg-${getRoleBadgeColor(log.actor.role)} bg-opacity-10 text-${getRoleBadgeColor(log.actor.role)} border border-${getRoleBadgeColor(log.actor.role)} border-opacity-25`}>
              {log.actor.role}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (log) => (
        <span className={`badge bg-${getActionBadgeColor(log.action)}`}>
          {log.action}
        </span>
      ),
    },
    {
      key: 'entity',
      label: 'Entity',
      render: (log) => (
        <div>
          <div className="fw-medium">{log.entity}</div>
          <small className="text-muted">{log.entityId}</small>
        </div>
      ),
    },
    {
      key: 'details',
      label: 'Details',
      render: (log) => (
        <div className="text-truncate" style={{ maxWidth: '300px' }} title={log.details}>
          {log.details}
        </div>
      ),
    },
    {
      key: 'metadata',
      label: 'Metadata',
      render: (log) => (
        <div>
          <small className="text-muted d-block">IP: {log.ip}</small>
          <small className="text-muted" title={log.userAgent}>
            {log.userAgent.split('/')[0]}
          </small>
        </div>
      ),
    },
  ];

  const getRoleBadgeColor = (role) => {
    const colors = {
      ADMIN: 'danger',
      STAFF: 'primary',
      DELIVERY: 'warning',
      CUSTOMER: 'success',
    };
    return colors[role] || 'secondary';
  };

  const getActionBadgeColor = (action) => {
    const colors = {
      CREATE: 'success',
      UPDATE: 'primary',
      DELETE: 'danger',
      LOGIN: 'info',
      LOGOUT: 'secondary',
      VIEW: 'light',
    };
    return colors[action] || 'secondary';
  };

  const entityTypes = [
    'Order', 'Product', 'Customer', 'Delivery', 'User', 'Inquiry', 'Task'
  ];

  const actionTypes = [
    'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW'
  ];

  const roles = [
    'ADMIN', 'STAFF', 'DELIVERY', 'CUSTOMER'
  ];

  const clearFilters = () => {
    setFilters({
      actor: '',
      entity: '',
      action: '',
      startDate: DateTime.now().minus({ days: 7 }).toISODate(),
      endDate: DateTime.now().toISODate(),
    });
    setSearch('');
    setPage(1);
  };

  return (
    <div className="audit-logs">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Audit Logs</h1>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary">
            <i className="bi bi-download me-2"></i>
            Export Logs
          </button>
          <button className="btn btn-outline-secondary">
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </button>
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
                placeholder="Search by user, entity, or details..."
              />
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={filters.entity}
                onChange={(e) => setFilters(prev => ({ ...prev, entity: e.target.value }))}
              >
                <option value="">All Entities</option>
                {entityTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={filters.action}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              >
                <option value="">All Actions</option>
                {actionTypes.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                value={filters.endDate}
                max={DateTime.now().toISODate()}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="row g-3 mt-0">
            <div className="col-md-3">
              <select
                className="form-select"
                value={filters.actor}
                onChange={(e) => setFilters(prev => ({ ...prev, actor: e.target.value }))}
              >
                <option value="">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={clearFilters}
              >
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                Clear Filters
              </button>
            </div>
            <div className="col-md-6">
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    startDate: DateTime.now().startOf('day').toISODate(),
                    endDate: DateTime.now().toISODate(),
                  }))}
                >
                  Today
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    startDate: DateTime.now().minus({ days: 7 }).toISODate(),
                    endDate: DateTime.now().toISODate(),
                  }))}
                >
                  Last 7 Days
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    startDate: DateTime.now().minus({ days: 30 }).toISODate(),
                    endDate: DateTime.now().toISODate(),
                  }))}
                >
                  Last 30 Days
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25">
            <div className="card-body text-center">
              <i className="bi bi-activity fs-1 text-primary"></i>
              <h4 className="mt-2 mb-1">48</h4>
              <p className="text-muted mb-0">Total Actions</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success bg-opacity-10 border-success border-opacity-25">
            <div className="card-body text-center">
              <i className="bi bi-plus-circle fs-1 text-success"></i>
              <h4 className="mt-2 mb-1">24</h4>
              <p className="text-muted mb-0">Creates</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning bg-opacity-10 border-warning border-opacity-25">
            <div className="card-body text-center">
              <i className="bi bi-pencil-square fs-1 text-warning"></i>
              <h4 className="mt-2 mb-1">18</h4>
              <p className="text-muted mb-0">Updates</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger bg-opacity-10 border-danger border-opacity-25">
            <div className="card-body text-center">
              <i className="bi bi-trash fs-1 text-danger"></i>
              <h4 className="mt-2 mb-1">3</h4>
              <p className="text-muted mb-0">Deletes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <DataTable
        data={mockData.data}
        columns={columns}
        loading={false}
        error={null}
        pagination={{
          page,
          totalPages: mockData.totalPages,
          totalItems: mockData.totalItems,
          onPageChange: setPage,
        }}
        className="audit-logs-table"
      />

      {/* Security Notice */}
      <div className="alert alert-info mt-4">
        <div className="d-flex align-items-start">
          <i className="bi bi-shield-check fs-4 me-3 text-info"></i>
          <div>
            <h6 className="alert-heading mb-1">Audit Log Information</h6>
            <p className="mb-2">
              Audit logs are automatically generated for all system activities and are stored securely. 
              These logs are immutable and cannot be modified or deleted.
            </p>
            <ul className="mb-0 ps-3">
              <li>Logs are retained for 1 year for compliance purposes</li>
              <li>All timestamps are displayed in your local timezone</li>
              <li>User actions are tracked across all system modules</li>
              <li>Export functionality is available for compliance reporting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
