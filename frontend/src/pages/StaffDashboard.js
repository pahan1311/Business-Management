import React, { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/helpers';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchStaffData();
    }
  }, [user]);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getByAssignee(user.id);
      const staffTasks = response.data;
      
      setTasks(staffTasks.slice(0, 10)); // Show recent tasks

      // Calculate stats
      const totalTasks = staffTasks.length;
      const pendingTasks = staffTasks.filter(task => task.status === 'pending').length;
      const inProgressTasks = staffTasks.filter(task => task.status === 'in_progress').length;
      const completedTasks = staffTasks.filter(task => task.status === 'completed').length;

      setStats({
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks
      });
    } catch (error) {
      console.error('Failed to fetch staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await taskAPI.updateStatus(taskId, status);
      await fetchStaffData(); // Refresh data
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Staff Dashboard</h1>
          <p className="text-muted mb-0">Welcome back, {user?.name || user?.email}</p>
        </div>
        <button 
          className="btn btn-outline-primary"
          onClick={fetchStaffData}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">Total Tasks</h6>
                  <h2 className="mb-0">{stats.totalTasks}</h2>
                </div>
                <i className="bi bi-list-check fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">Pending Tasks</h6>
                  <h2 className="mb-0">{stats.pendingTasks}</h2>
                </div>
                <i className="bi bi-clock fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">In Progress</h6>
                  <h2 className="mb-0">{stats.inProgressTasks}</h2>
                </div>
                <i className="bi bi-gear fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title mb-0">Completed</h6>
                  <h2 className="mb-0">{stats.completedTasks}</h2>
                </div>
                <i className="bi bi-check-circle fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Task List */}
        <div className="col-md-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">My Tasks</h5>
              <a href="/staff/tasks" className="btn btn-sm btn-outline-primary">
                View All Tasks
              </a>
            </div>
            <div className="card-body">
              {tasks.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-list-check fs-1 d-block mb-2"></i>
                  <p className="mb-0">No tasks assigned</p>
                  <small>Tasks will appear here when assigned to you</small>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map(task => (
                        <tr key={task.id}>
                          <td>
                            <div>
                              <strong>{task.title}</strong>
                              <br />
                              <small className="text-muted">{task.description}</small>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-secondary">{task.type}</span>
                          </td>
                          <td>
                            <StatusBadge status={task.status} />
                          </td>
                          <td>{formatDate(task.dueDate)}</td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              {task.status === 'pending' && (
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                >
                                  Start
                                </button>
                              )}
                              {task.status === 'in_progress' && (
                                <button
                                  className="btn btn-outline-success"
                                  onClick={() => updateTaskStatus(task.id, 'completed')}
                                >
                                  Complete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <a href="/staff/tasks" className="btn btn-primary">
                  <i className="bi bi-list-check me-2"></i>
                  View All Tasks
                </a>
                <a href="/staff/inventory" className="btn btn-outline-primary">
                  <i className="bi bi-box-seam me-2"></i>
                  Update Inventory
                </a>
                <a href="/staff/orders" className="btn btn-outline-secondary">
                  <i className="bi bi-cart me-2"></i>
                  Order Preparation
                </a>
              </div>
            </div>
          </div>

          {/* Task Priority Guide */}
          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">Task Priority</h6>
            </div>
            <div className="card-body">
              <div className="small">
                <div className="d-flex align-items-center mb-2">
                  <span className="badge bg-danger me-2">High</span>
                  <span>Complete as soon as possible</span>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <span className="badge bg-warning me-2">Medium</span>
                  <span>Complete within scheduled time</span>
                </div>
                <div className="d-flex align-items-center">
                  <span className="badge bg-success me-2">Low</span>
                  <span>Complete when time permits</span>
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
