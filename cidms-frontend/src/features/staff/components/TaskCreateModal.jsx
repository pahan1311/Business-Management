import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useCreateTaskMutation } from '../../tasks/api';
import { TASK_PRIORITY } from '../../../utils/constants';

const TaskCreateModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: TASK_PRIORITY.MEDIUM,
    dueDate: '',
    dueTime: '',
    assignTo: '', // Optional - for creating tasks for others
  });

  const { enqueueSnackbar } = useSnackbar();
  const [createTask, { isLoading }] = useCreateTaskMutation();

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      enqueueSnackbar('Task title is required', { variant: 'error' });
      return;
    }

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
    };

    // Combine date and time if both are provided
    if (formData.dueDate) {
      const dueDateTime = formData.dueTime 
        ? `${formData.dueDate}T${formData.dueTime}`
        : `${formData.dueDate}T23:59`;
      taskData.dueDate = dueDateTime;
    }

    // Add assignTo if specified (for managers/admins creating tasks for staff)
    if (formData.assignTo) {
      taskData.assignedTo = formData.assignTo;
    }

    try {
      await createTask(taskData).unwrap();
      enqueueSnackbar('Task created successfully', { variant: 'success' });
      onSuccess();
    } catch (error) {
      enqueueSnackbar('Failed to create task', { variant: 'error' });
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create New Task</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={isLoading}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">
                    Task Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.title}
                    onChange={handleInputChange('title')}
                    placeholder="Enter task title..."
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    value={formData.description}
                    onChange={handleInputChange('description')}
                    rows="4"
                    placeholder="Provide detailed description of the task..."
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={formData.priority}
                    onChange={handleInputChange('priority')}
                  >
                    <option value={TASK_PRIORITY.LOW}>Low Priority</option>
                    <option value={TASK_PRIORITY.MEDIUM}>Medium Priority</option>
                    <option value={TASK_PRIORITY.HIGH}>High Priority</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Assign To (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.assignTo}
                    onChange={handleInputChange('assignTo')}
                    placeholder="Staff member ID or leave empty for self"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Due Date (Optional)</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.dueDate}
                    onChange={handleInputChange('dueDate')}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Due Time (Optional)</label>
                  <input
                    type="time"
                    className="form-control"
                    value={formData.dueTime}
                    onChange={handleInputChange('dueTime')}
                    disabled={!formData.dueDate}
                  />
                </div>
              </div>

              {/* Priority Preview */}
              <div className="mt-3">
                <div className="alert alert-light border">
                  <div className="d-flex align-items-center">
                    <span className="me-2">Priority Preview:</span>
                    {formData.priority === TASK_PRIORITY.HIGH && (
                      <span className="badge bg-danger">
                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                        High Priority
                      </span>
                    )}
                    {formData.priority === TASK_PRIORITY.MEDIUM && (
                      <span className="badge bg-warning text-dark">
                        <i className="bi bi-exclamation-circle-fill me-1"></i>
                        Medium Priority
                      </span>
                    )}
                    {formData.priority === TASK_PRIORITY.LOW && (
                      <span className="badge bg-secondary">
                        <i className="bi bi-info-circle-fill me-1"></i>
                        Low Priority
                      </span>
                    )}
                  </div>
                  {formData.dueDate && (
                    <div className="mt-2">
                      <small className="text-muted">
                        Due: {new Date(formData.dueDate).toLocaleDateString()}
                        {formData.dueTime && ` at ${formData.dueTime}`}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !formData.title.trim()}
              >
                {isLoading && <span className="spinner-border spinner-border-sm me-2"></span>}
                Create Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskCreateModal;
