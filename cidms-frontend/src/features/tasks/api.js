import { api } from '../../app/api';

export const tasksApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all tasks with filters
    getTasks: builder.query({
      query: ({ page = 1, limit = 10, status, assignedTo, priority, type, dueDate } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(status && { status }),
          ...(assignedTo && { assignedTo }),
          ...(priority && { priority }),
          ...(type && { type }),
          ...(dueDate && { dueDate }),
        });
        return `tasks?${params}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Task', id })),
              { type: 'Task', id: 'LIST' },
            ]
          : [{ type: 'Task', id: 'LIST' }],
    }),

    // Get single task
    getTask: builder.query({
      query: (id) => `tasks/${id}`,
      providesTags: (result, error, id) => [{ type: 'Task', id }],
    }),

    // Create new task
    createTask: builder.mutation({
      query: (taskData) => ({
        url: 'tasks',
        method: 'POST',
        body: taskData,
      }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),

    // Update task
    updateTask: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `tasks/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),

    // Update task status
    updateTaskStatus: builder.mutation({
      query: ({ id, status, notes }) => ({
        url: `tasks/${id}/status`,
        method: 'POST',
        body: { status, notes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),

    // Assign task
    assignTask: builder.mutation({
      query: ({ id, assignedTo, notes }) => ({
        url: `tasks/${id}/assign`,
        method: 'POST',
        body: { assignedTo, notes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),

    // Add task comment
    addTaskComment: builder.mutation({
      query: ({ id, comment }) => ({
        url: `tasks/${id}/comments`,
        method: 'POST',
        body: comment,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Task', id },
        { type: 'TaskComment', id: `task-${id}` },
      ],
    }),

    // Get task comments
    getTaskComments: builder.query({
      query: (taskId) => `tasks/${taskId}/comments`,
      providesTags: (result, error, taskId) => [
        { type: 'TaskComment', id: `task-${taskId}` }
      ],
    }),

    // Complete task
    completeTask: builder.mutation({
      query: ({ id, completion }) => ({
        url: `tasks/${id}/complete`,
        method: 'POST',
        body: completion,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),

    // Get my tasks (for logged-in user)
    getMyTasks: builder.query({
      query: ({ status, priority } = {}) => {
        const params = new URLSearchParams({
          ...(status && { status }),
          ...(priority && { priority }),
        });
        return `tasks/my-tasks?${params}`;
      },
      providesTags: ['MyTasks'],
    }),

    // Get task analytics
    getTaskAnalytics: builder.query({
      query: ({ startDate, endDate, assignedTo, type } = {}) => {
        const params = new URLSearchParams({
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          ...(assignedTo && { assignedTo }),
          ...(type && { type }),
        });
        return `tasks/analytics?${params}`;
      },
      providesTags: ['TaskAnalytics'],
    }),

    // Get overdue tasks
    getOverdueTasks: builder.query({
      query: ({ assignedTo } = {}) => {
        const params = new URLSearchParams({
          ...(assignedTo && { assignedTo }),
        });
        return `tasks/overdue?${params}`;
      },
      providesTags: ['OverdueTasks'],
    }),

    // Bulk update tasks
    bulkUpdateTasks: builder.mutation({
      query: ({ taskIds, update }) => ({
        url: 'tasks/bulk-update',
        method: 'POST',
        body: { taskIds, update },
      }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),

    // Delete task
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),

    // Upload task attachment
    uploadTaskAttachment: builder.mutation({
      query: ({ taskId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `tasks/${taskId}/attachments`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'Task', id: taskId },
      ],
    }),

    // Delete task attachment
    deleteTaskAttachment: builder.mutation({
      query: ({ taskId, attachmentId }) => ({
        url: `tasks/${taskId}/attachments/${attachmentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'Task', id: taskId },
      ],
    }),

    // Create task template
    createTaskTemplate: builder.mutation({
      query: (template) => ({
        url: 'tasks/templates',
        method: 'POST',
        body: template,
      }),
      invalidatesTags: ['TaskTemplate'],
    }),

    // Get task templates
    getTaskTemplates: builder.query({
      query: () => 'tasks/templates',
      providesTags: ['TaskTemplate'],
    }),

    // Create task from template
    createTaskFromTemplate: builder.mutation({
      query: ({ templateId, customData }) => ({
        url: `tasks/templates/${templateId}/create`,
        method: 'POST',
        body: customData,
      }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),

    // Get task calendar
    getTaskCalendar: builder.query({
      query: ({ month, year, assignedTo } = {}) => {
        const params = new URLSearchParams({
          ...(month && { month: month.toString() }),
          ...(year && { year: year.toString() }),
          ...(assignedTo && { assignedTo }),
        });
        return `tasks/calendar?${params}`;
      },
      providesTags: (result, error, { month, year, assignedTo }) => [
        { type: 'TaskCalendar', id: `${year}-${month}-${assignedTo || 'all'}` }
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useAssignTaskMutation,
  useAddTaskCommentMutation,
  useGetTaskCommentsQuery,
  useCompleteTaskMutation,
  useGetMyTasksQuery,
  useGetTaskAnalyticsQuery,
  useGetOverdueTasksQuery,
  useBulkUpdateTasksMutation,
  useDeleteTaskMutation,
  useUploadTaskAttachmentMutation,
  useDeleteTaskAttachmentMutation,
  useCreateTaskTemplateMutation,
  useGetTaskTemplatesQuery,
  useCreateTaskFromTemplateMutation,
  useGetTaskCalendarQuery,
} = tasksApi;
