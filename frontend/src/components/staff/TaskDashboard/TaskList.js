import React, { useState, useEffect } from 'react';
import { taskAPI } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import StatusBadge from '../../common/StatusBadge';
import Button from '../../common/Button';
import LoadingSpinner from '../../common/LoadingSpinner';
import { formatDate } from '../../../utils/helpers';

const TaskList = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getByAssignee(user.id);
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    setUpdating({ ...updating, [taskId]: true });
    try {
      await taskAPI.updateStatus(taskId, newStatus);
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Failed to update task status:', error);
    } finally {
      setUpdating({ ...updating, [taskId]: false });
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
      default:
        return 'secondary';
    }
  };

  const getTaskTypeIcon = (type) => {
    switch (type) {
      case 'inventory':
        return 'box-seam';
      case 'order_prep':
        return 'cart';
      case 'quality_check':
        return 'check-circle';
      case 'maintenance':
        return 'gear';
      case 'cleaning':
        return 'brush';
      default:
        return 'list-check';
    }
  };

  const getAvailableActions = (task) => {
    const actions = [];
    
    if (task.status === 'pending') {
      actions.push({
        label: 'Start Task',
        status: 'in_progress',
        variant: 'primary',
        icon: 'play-fill'
      });
    }
    
    if (task.status === 'in_progress') {
      actions.push({
        label: 'Complete',
        status: 'completed',
        variant: 'success',
        icon: 'check-lg'
      });
      actions.push({
        label: 'Pause',
        status: 'pending',
        variant: 'warning',
        icon: 'pause-fill'
      });
    }
    
    return actions;
  };

  if (loading) {
    return <LoadingSpinner text="Loading your tasks..." />;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>My Tasks</h2>
          <p className="text-muted mb-0">Manage and track your assigned tasks</p>
        </div>
        <button 
          className="btn btn-outline-primary"
          onClick={fetchTasks}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-3">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="col-md-6 text-end">
          <div className="row text-center">
            <div className="col-3">
              <h6 className="text-warning mb-0">{tasks.filter(t => t.status === 'pending').length}</h6>
              <small className="text-muted">Pending</small>
            </div>
            <div className="col-3">
              <h6 className="text-info mb-0">{tasks.filter(t => t.status === 'in_progress').length}</h6>
              <small className="text-muted">Active</small>
            </div>
            <div className="col-3">
              <h6 className="text-success mb-0">{tasks.filter(t => t.status === 'completed').length}</h6>
              <small className="text-muted">Completed</small>
            </div>
            <div className="col-3">
              <h6 className="text-danger mb-0">{tasks.filter(t => t.priority === 'urgent').length}</h6>
              <small className="text-muted">Urgent</small>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="card">
        <div className="card-body">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-list-check fs-1 text-muted d-block mb-2"></i>
              <p className="text-muted">No tasks found</p>
              <small>Tasks will appear here when assigned to you</small>
            </div>
          ) : (
            <div className="row">
              {filteredTasks.map(task => (
                <div key={task.id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <i className={`bi bi-${getTaskTypeIcon(task.type)} me-2`}></i>
                        <span className="badge bg-secondary">{task.type}</span>
                      </div>
                      <span className={`badge bg-${getPriorityColor(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="card-body">
                      <h6 className="card-title">{task.title}</h6>
                      <p className="card-text text-muted small">
                        {task.description}
                      </p>
                      
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small className="text-muted">Status:</small>
                          <StatusBadge status={task.status} />
                        </div>
                        
                        {task.dueDate && (
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-muted">Due:</small>
                            <small className={task.dueDate < new Date() && task.status !== 'completed' ? 'text-danger' : ''}>
                              {formatDate(task.dueDate)}
                            </small>
                          </div>
                        )}
                        
                        {task.estimatedDuration && (
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-muted">Duration:</small>
                            <small>{task.estimatedDuration} minutes</small>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="card-footer">
                      <div className="d-flex gap-1 flex-wrap">
                        {getAvailableActions(task).map(action => (
                          <Button
                            key={action.status}
                            variant={action.variant}
                            size="sm"
                            loading={updating[task.id]}
                            onClick={() => updateTaskStatus(task.id, action.status)}
                            className="flex-fill"
                          >
                            <i className={`bi bi-${action.icon} me-1`}></i>
                            {action.label}
                          </Button>
                        ))}
                      </div>
                      
                      {task.status === 'completed' && (
                        <div className="mt-2 text-center">
                          <small className="text-success">
                            <i className="bi bi-check-circle me-1"></i>
                            Completed {task.completedAt ? formatDate(task.completedAt) : ''}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Summary */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Today's Summary</h6>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-3">
                  <div className="border-end">
                    <h4 className="text-primary mb-0">{tasks.length}</h4>
                    <small className="text-muted">Total Tasks</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="border-end">
                    <h4 className="text-success mb-0">
                      {tasks.filter(t => t.status === 'completed').length}
                    </h4>
                    <small className="text-muted">Completed</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="border-end">
                    <h4 className="text-warning mb-0">
                      {tasks.filter(t => t.status === 'in_progress').length}
                    </h4>
                    <small className="text-muted">In Progress</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <h4 className="text-info mb-0">
                    {Math.round((tasks.filter(t => t.status === 'completed').length / Math.max(tasks.length, 1)) * 100)}%
                  </h4>
                  <small className="text-muted">Completion Rate</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskList;
