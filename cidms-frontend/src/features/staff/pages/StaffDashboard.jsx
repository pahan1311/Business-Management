import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGetMyTasksQuery } from '../../tasks/api';
import { useGetOrdersQuery } from '../../orders/api';
import StatusBadge from '../../../components/common/StatusBadge';
import LoadingBlock from '../../../components/common/LoadingBlock';
import { ORDER_STATUS, TASK_STATUS } from '../../../utils/constants';
import { DateTime } from 'luxon';

const StaffDashboard = () => {
  const { data: tasks, isLoading: tasksLoading } = useGetMyTasksQuery();
  const { data: orders, isLoading: ordersLoading } = useGetOrdersQuery({
    status: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PROCESSING].join(','),
    limit: 10
  });

  const tasksByStatus = tasks?.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {}) || {};

  const urgentTasks = tasks?.filter(task => 
    task.priority === 'HIGH' || task.priority === 'URGENT'
  ) || [];

  return (
    <div className="staff-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Staff Dashboard</h1>
        <div className="text-muted">
          {DateTime.now().toFormat('EEEE, MMMM dd, yyyy')}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25">
            <div className="card-body text-center">
              <i className="bi bi-list-task fs-1 text-primary"></i>
              <h4 className="mt-2 mb-1">{tasks?.length || 0}</h4>
              <p className="text-muted mb-0">My Tasks</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning bg-opacity-10 border-warning border-opacity-25">
            <div className="card-body text-center">
              <i className="bi bi-exclamation-triangle fs-1 text-warning"></i>
              <h4 className="mt-2 mb-1">{urgentTasks.length}</h4>
              <p className="text-muted mb-0">Urgent Tasks</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info bg-opacity-10 border-info border-opacity-25">
            <div className="card-body text-center">
              <i className="bi bi-box-seam fs-1 text-info"></i>
              <h4 className="mt-2 mb-1">{orders?.data?.length || 0}</h4>
              <p className="text-muted mb-0">Orders to Prepare</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success bg-opacity-10 border-success border-opacity-25">
            <div className="card-body text-center">
              <i className="bi bi-check-circle fs-1 text-success"></i>
              <h4 className="mt-2 mb-1">{tasksByStatus[TASK_STATUS.COMPLETED] || 0}</h4>
              <p className="text-muted mb-0">Completed Today</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* My Tasks */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-list-task me-2"></i>
                My Tasks
              </h5>
              <Link to="/staff/tasks" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </div>
            <div className="card-body">
              {tasksLoading ? (
                <LoadingBlock size="sm" />
              ) : tasks && tasks.length > 0 ? (
                <>
                  {/* Task Status Summary */}
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="d-flex justify-content-between p-2 bg-light rounded">
                        <span>Pending</span>
                        <span className="badge bg-warning">{tasksByStatus[TASK_STATUS.PENDING] || 0}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="d-flex justify-content-between p-2 bg-light rounded">
                        <span>In Progress</span>
                        <span className="badge bg-primary">{tasksByStatus[TASK_STATUS.IN_PROGRESS] || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Tasks */}
                  <div className="list-group list-group-flush">
                    {tasks.slice(0, 5).map(task => (
                      <div key={task.id} className="list-group-item px-0">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{task.title}</h6>
                            <p className="mb-1 text-muted small">{task.description}</p>
                            <div className="d-flex gap-2">
                              <StatusBadge status={task.status} type="task" size="sm" />
                              {task.priority && task.priority !== 'NORMAL' && (
                                <span className={`badge badge-sm bg-${
                                  task.priority === 'HIGH' ? 'warning' : 
                                  task.priority === 'URGENT' ? 'danger' : 'secondary'
                                }`}>
                                  {task.priority}
                                </span>
                              )}
                            </div>
                          </div>
                          {task.dueDate && (
                            <small className="text-muted">
                              Due: {DateTime.fromISO(task.dueDate).toFormat('MMM dd')}
                            </small>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-check-circle-fill fs-1 text-success"></i>
                  <p className="mt-2 text-muted">No tasks assigned</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Orders to Prepare */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-box-seam me-2"></i>
                Orders to Prepare
              </h5>
              <Link to="/staff/orders" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </div>
            <div className="card-body">
              {ordersLoading ? (
                <LoadingBlock size="sm" />
              ) : orders?.data && orders.data.length > 0 ? (
                <div className="list-group list-group-flush">
                  {orders.data.slice(0, 5).map(order => (
                    <div key={order.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <Link 
                              to={`/staff/orders/${order.id}`}
                              className="fw-bold text-decoration-none"
                            >
                              #{order.orderNumber}
                            </Link>
                            <StatusBadge status={order.status} type="order" size="sm" />
                          </div>
                          <p className="mb-1 text-muted small">{order.customerName}</p>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                              {order.totalItems} items • ${order.totalAmount?.toFixed(2)}
                            </small>
                            <small className="text-muted">
                              {DateTime.fromISO(order.orderDate).toFormat('MMM dd, hh:mm a')}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-clipboard-check fs-1 text-success"></i>
                  <p className="mt-2 text-muted">No orders to prepare</p>
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
              <h6 className="mb-0">Quick Actions</h6>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <Link to="/staff/inventory" className="btn btn-outline-primary w-100">
                    <i className="bi bi-boxes me-2"></i>
                    Manage Inventory
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/staff/orders" className="btn btn-outline-success w-100">
                    <i className="bi bi-bag-check me-2"></i>
                    Process Orders
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/staff/tasks/create" className="btn btn-outline-info w-100">
                    <i className="bi bi-plus-circle me-2"></i>
                    Create Task
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/staff/inventory/movements" className="btn btn-outline-warning w-100">
                    <i className="bi bi-arrow-left-right me-2"></i>
                    Stock Movements
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
