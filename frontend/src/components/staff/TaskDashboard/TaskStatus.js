import React, { useState } from 'react';
import StatusBadge from '../../common/StatusBadge';
import { formatDate } from '../../../utils/helpers';

const TaskStatus = ({ task, onStatusUpdate }) => {
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await onStatusUpdate(task.id, newStatus);
    } catch (error) {
      console.error('Failed to update task status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusHistory = () => {
    // Mock status history - in real app, this would come from the API
    const history = [
      { status: 'pending', timestamp: task.createdAt, note: 'Task created' },
    ];

    if (task.startedAt) {
      history.push({ status: 'in_progress', timestamp: task.startedAt, note: 'Task started' });
    }

    if (task.completedAt) {
      history.push({ status: 'completed', timestamp: task.completedAt, note: 'Task completed' });
    }

    return history;
  };

  const getAvailableTransitions = () => {
    switch (task.status) {
      case 'pending':
        return [
          { status: 'in_progress', label: 'Start Task', variant: 'primary', icon: 'play-fill' }
        ];
      case 'in_progress':
        return [
          { status: 'completed', label: 'Mark Complete', variant: 'success', icon: 'check-lg' },
          { status: 'pending', label: 'Pause', variant: 'warning', icon: 'pause-fill' }
        ];
      case 'completed':
        return [
          { status: 'in_progress', label: 'Reopen', variant: 'info', icon: 'arrow-clockwise' }
        ];
      default:
        return [];
    }
  };

  const calculateDuration = () => {
    if (task.startedAt && task.completedAt) {
      const start = new Date(task.startedAt);
      const end = new Date(task.completedAt);
      const duration = Math.round((end - start) / (1000 * 60)); // minutes
      return duration;
    }
    return null;
  };

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Task Status</h6>
        <StatusBadge status={task.status} />
      </div>
      
      <div className="card-body">
        {/* Current Status Info */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-muted">Current Status:</span>
            <StatusBadge status={task.status} />
          </div>
          
          {task.dueDate && (
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted">Due Date:</span>
              <span className={new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-danger' : ''}>
                {formatDate(task.dueDate)}
              </span>
            </div>
          )}
          
          {task.priority && (
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted">Priority:</span>
              <span className={`badge bg-${task.priority === 'urgent' ? 'danger' : task.priority === 'high' ? 'warning' : 'info'}`}>
                {task.priority.toUpperCase()}
              </span>
            </div>
          )}
          
          {task.estimatedDuration && (
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted">Estimated Duration:</span>
              <span>{task.estimatedDuration} minutes</span>
            </div>
          )}
          
          {calculateDuration() && (
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted">Actual Duration:</span>
              <span className={calculateDuration() > task.estimatedDuration ? 'text-warning' : 'text-success'}>
                {calculateDuration()} minutes
              </span>
            </div>
          )}
        </div>

        {/* Available Actions */}
        {getAvailableTransitions().length > 0 && (
          <div className="mb-4">
            <h6>Available Actions</h6>
            <div className="d-grid gap-2">
              {getAvailableTransitions().map(transition => (
                <button
                  key={transition.status}
                  className={`btn btn-${transition.variant}`}
                  onClick={() => handleStatusUpdate(transition.status)}
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className={`bi bi-${transition.icon} me-2`}></i>
                      {transition.label}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mb-4">
          <h6>Progress</h6>
          <div className="progress" style={{ height: '8px' }}>
            <div 
              className={`progress-bar ${task.status === 'completed' ? 'bg-success' : task.status === 'in_progress' ? 'bg-info' : 'bg-warning'}`}
              role="progressbar" 
              style={{ 
                width: task.status === 'completed' ? '100%' : 
                       task.status === 'in_progress' ? '50%' : '25%' 
              }}
            ></div>
          </div>
          <div className="d-flex justify-content-between mt-1">
            <small className="text-muted">Created</small>
            <small className="text-muted">In Progress</small>
            <small className="text-muted">Completed</small>
          </div>
        </div>

        {/* Status History */}
        <div>
          <h6>Status History</h6>
          <div className="timeline">
            {getStatusHistory().map((entry, index) => (
              <div key={index} className="d-flex align-items-start mb-3">
                <div className="flex-shrink-0">
                  <div className={`rounded-circle p-2 bg-${entry.status === 'completed' ? 'success' : entry.status === 'in_progress' ? 'info' : 'warning'}`}>
                    <i className={`bi bi-${entry.status === 'completed' ? 'check' : entry.status === 'in_progress' ? 'play' : 'clock'} text-white`}></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <StatusBadge status={entry.status} />
                    <small className="text-muted">{formatDate(entry.timestamp)}</small>
                  </div>
                  {entry.note && (
                    <small className="text-muted d-block">{entry.note}</small>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Details */}
        {(task.assignedBy || task.location || task.equipment) && (
          <div className="mt-4">
            <h6>Additional Information</h6>
            {task.assignedBy && (
              <p className="mb-1">
                <strong>Assigned by:</strong> {task.assignedBy}
              </p>
            )}
            {task.location && (
              <p className="mb-1">
                <strong>Location:</strong> {task.location}
              </p>
            )}
            {task.equipment && (
              <p className="mb-1">
                <strong>Equipment needed:</strong> {task.equipment}
              </p>
            )}
            {task.instructions && (
              <div>
                <strong>Special Instructions:</strong>
                <p className="text-muted mt-1">{task.instructions}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskStatus;
