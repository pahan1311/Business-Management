import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { 
  useGetMyTasksQuery, 
  useUpdateTaskStatusMutation,
  useCreateTaskMutation 
} from '../../tasks/api';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import SearchInput from '../../../components/common/SearchInput';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import TaskCreateModal from '../components/TaskCreateModal';
import { TASK_STATUS, TASK_PRIORITY } from '../../../utils/constants';
import { DateTime } from 'luxon';

const StaffTasks = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading, error, refetch } = useGetMyTasksQuery({
    page,
    limit: 10,
    search,
    status: statusFilter,
    priority: priorityFilter,
  });

  const [updateTaskStatus, { isLoading: isUpdatingStatus }] = useUpdateTaskStatusMutation();

  const columns = [
    {
      key: 'title',
      label: 'Task',
      render: (task) => (
        <div>
          <div className="fw-medium">{task.title}</div>
          <small className="text-muted">{task.description}</small>
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (task) => {
        const priorityConfig = {
          [TASK_PRIORITY.HIGH]: { class: 'bg-danger', icon: 'bi-exclamation-triangle-fill' },
          [TASK_PRIORITY.MEDIUM]: { class: 'bg-warning text-dark', icon: 'bi-exclamation-circle-fill' },
          [TASK_PRIORITY.LOW]: { class: 'bg-secondary', icon: 'bi-info-circle-fill' },
        };
        
        const config = priorityConfig[task.priority] || priorityConfig[TASK_PRIORITY.LOW];
        
        return (
          <span className={`badge ${config.class}`}>
            <i className={`bi ${config.icon} me-1`}></i>
            {task.priority}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (task) => <StatusBadge status={task.status} type="task" />,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (task) => {
        if (!task.dueDate) return <span className="text-muted">No due date</span>;
        
        const dueDate = DateTime.fromISO(task.dueDate);
        const isOverdue = dueDate < DateTime.now() && task.status !== TASK_STATUS.COMPLETED;
        const isDueSoon = dueDate < DateTime.now().plus({ hours: 24 }) && task.status !== TASK_STATUS.COMPLETED;
        
        return (
          <div>
            <div className={`${isOverdue ? 'text-danger fw-bold' : isDueSoon ? 'text-warning fw-bold' : ''}`}>
              {dueDate.toFormat('MMM dd, yyyy')}
            </div>
            <small className="text-muted">
              {dueDate.toFormat('hh:mm a')}
            </small>
          </div>
        );
      },
    },
    {
      key: 'assignedBy',
      label: 'Assigned By',
      render: (task) => (
        <div>
          <div>{task.assignedByName || 'System'}</div>
          <small className="text-muted">
            {DateTime.fromISO(task.createdAt).toFormat('MMM dd')}
          </small>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (task) => (
        <div className="dropdown">
          <button
            className="btn btn-sm btn-outline-secondary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
          >
            Actions
          </button>
          <ul className="dropdown-menu">
            {task.status === TASK_STATUS.PENDING && (
              <li>
                <button
                  className="dropdown-item text-primary"
                  onClick={() => {
                    setSelectedTask(task);
                    setActionType('start');
                  }}
                >
                  <i className="bi bi-play-circle me-2"></i>
                  Start Task
                </button>
              </li>
            )}
            {task.status === TASK_STATUS.IN_PROGRESS && (
              <>
                <li>
                  <button
                    className="dropdown-item text-success"
                    onClick={() => {
                      setSelectedTask(task);
                      setActionType('complete');
                    }}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    Mark Complete
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item text-warning"
                    onClick={() => {
                      setSelectedTask(task);
                      setActionType('pause');
                    }}
                  >
                    <i className="bi bi-pause-circle me-2"></i>
                    Pause Task
                  </button>
                </li>
              </>
            )}
            {(task.status === TASK_STATUS.PENDING || task.status === TASK_STATUS.IN_PROGRESS) && (
              <li>
                <button
                  className="dropdown-item text-info"
                  onClick={() => {
                    setSelectedTask(task);
                    setActionType('note');
                  }}
                >
                  <i className="bi bi-chat-left-text me-2"></i>
                  Add Note
                </button>
              </li>
            )}
          </ul>
        </div>
      ),
    },
  ];

  const handleTaskAction = async () => {
    if (!selectedTask || !actionType) return;

    const statusMap = {
      start: TASK_STATUS.IN_PROGRESS,
      complete: TASK_STATUS.COMPLETED,
      pause: TASK_STATUS.PENDING,
    };

    const newStatus = statusMap[actionType];
    if (!newStatus) return;

    try {
      await updateTaskStatus({
        id: selectedTask.id,
        status: newStatus,
        notes: `Task ${actionType}ed by staff`,
      }).unwrap();

      const actionMessages = {
        start: 'Task started',
        complete: 'Task completed',
        pause: 'Task paused',
      };

      enqueueSnackbar(actionMessages[actionType], { variant: 'success' });

      setSelectedTask(null);
      setActionType(null);
      refetch();
    } catch (error) {
      enqueueSnackbar('Failed to update task', { variant: 'error' });
    }
  };

  const getActionTitle = () => {
    const titles = {
      start: 'Start Task',
      complete: 'Complete Task',
      pause: 'Pause Task',
    };
    return titles[actionType] || 'Update Task';
  };

  const getActionMessage = () => {
    const messages = {
      start: `Start working on "${selectedTask?.title}"?`,
      complete: `Mark "${selectedTask?.title}" as completed?`,
      pause: `Pause "${selectedTask?.title}"?`,
    };
    return messages[actionType] || 'Are you sure you want to perform this action?';
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: TASK_STATUS.PENDING, label: 'Pending' },
    { value: TASK_STATUS.IN_PROGRESS, label: 'In Progress' },
    { value: TASK_STATUS.COMPLETED, label: 'Completed' },
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: TASK_PRIORITY.HIGH, label: 'High Priority' },
    { value: TASK_PRIORITY.MEDIUM, label: 'Medium Priority' },
    { value: TASK_PRIORITY.LOW, label: 'Low Priority' },
  ];

  return (
    <div className="staff-tasks">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Tasks</h1>
        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Create Task
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={refetch}
            disabled={isLoading}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card bg-warning bg-opacity-10 border-warning border-opacity-25">
            <div className="card-body text-center py-3">
              <i className="bi bi-clock text-warning fs-4"></i>
              <h6 className="mt-2 mb-1">Pending Tasks</h6>
              <p className="text-muted mb-0 small">Tasks waiting to start</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25">
            <div className="card-body text-center py-3">
              <i className="bi bi-gear text-primary fs-4"></i>
              <h6 className="mt-2 mb-1">In Progress</h6>
              <p className="text-muted mb-0 small">Currently working on</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success bg-opacity-10 border-success border-opacity-25">
            <div className="card-body text-center py-3">
              <i className="bi bi-check-circle text-success fs-4"></i>
              <h6 className="mt-2 mb-1">Completed</h6>
              <p className="text-muted mb-0 small">Tasks finished</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger bg-opacity-10 border-danger border-opacity-25">
            <div className="card-body text-center py-3">
              <i className="bi bi-exclamation-triangle text-danger fs-4"></i>
              <h6 className="mt-2 mb-1">Overdue</h6>
              <p className="text-muted mb-0 small">Tasks past due date</p>
            </div>
          </div>
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
                placeholder="Search tasks..."
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setPriorityFilter('');
                  setPage(1);
                }}
              >
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        error={error}
        pagination={{
          page,
          totalPages: data?.totalPages || 0,
          totalItems: data?.totalItems || 0,
          onPageChange: setPage,
        }}
      />

      {/* Action Confirmation Dialog */}
      <ConfirmDialog
        open={!!selectedTask}
        title={getActionTitle()}
        message={getActionMessage()}
        onConfirm={handleTaskAction}
        onCancel={() => {
          setSelectedTask(null);
          setActionType(null);
        }}
        confirmText={actionType === 'complete' ? 'Complete' : actionType === 'start' ? 'Start' : 'Confirm'}
        confirmVariant={actionType === 'complete' ? 'success' : 'primary'}
        loading={isUpdatingStatus}
      />

      {/* Create Task Modal */}
      {showCreateModal && (
        <TaskCreateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            refetch();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

export default StaffTasks;
