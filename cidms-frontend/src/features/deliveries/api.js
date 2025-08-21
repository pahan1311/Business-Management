import { api } from '../../app/api';

export const deliveriesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get delivery tasks for a specific driver (my deliveries)
    getMyDeliveries: builder.query({
      query: ({ page = 1, limit = 10, status, date } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(status && { status }),
          ...(date && { date }),
        });
        return `deliveries/my-deliveries?${params}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Delivery', id })),
              { type: 'Delivery', id: 'MY_LIST' },
            ]
          : [{ type: 'Delivery', id: 'MY_LIST' }],
    }),

    // Get single delivery
    getDelivery: builder.query({
      query: (id) => `deliveries/${id}`,
      providesTags: (result, error, id) => [{ type: 'Delivery', id }],
    }),

    // Get delivery by QR code
    getDeliveryByQR: builder.query({
      query: (qrCode) => `deliveries/qr/${encodeURIComponent(qrCode)}`,
      providesTags: (result, error, qrCode) => [{ type: 'Delivery', id: `QR_${qrCode}` }],
    }),

    // Update delivery status
    updateDeliveryStatus: builder.mutation({
      query: ({ id, status, timestamp, notes, ...additionalData }) => ({
        url: `deliveries/${id}/status`,
        method: 'PUT',
        body: { status, timestamp, notes, ...additionalData },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Delivery', id },
        { type: 'Delivery', id: 'MY_LIST' },
        { type: 'DeliveryTask', id: 'LIST' },
      ],
    }),

    // Get all delivery tasks
    getDeliveryTasks: builder.query({
      query: ({ page = 1, limit = 10, status, driverId, priority, date } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(status && { status }),
          ...(driverId && { driverId }),
          ...(priority && { priority }),
          ...(date && { date }),
        });
        return `deliveries/tasks?${params}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'DeliveryTask', id })),
              { type: 'DeliveryTask', id: 'LIST' },
            ]
          : [{ type: 'DeliveryTask', id: 'LIST' }],
    }),

    // Get single delivery task
    getDeliveryTask: builder.query({
      query: (id) => `deliveries/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: 'DeliveryTask', id }],
    }),

    // Create delivery task
    createDeliveryTask: builder.mutation({
      query: (taskData) => ({
        url: 'deliveries/tasks',
        method: 'POST',
        body: taskData,
      }),
      invalidatesTags: [
        { type: 'DeliveryTask', id: 'LIST' },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    // Update delivery task
    updateDeliveryTask: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `deliveries/tasks/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'DeliveryTask', id },
        { type: 'DeliveryTask', id: 'LIST' },
      ],
    }),

    // Assign driver to task
    assignDriver: builder.mutation({
      query: ({ taskId, driverId }) => ({
        url: `deliveries/tasks/${taskId}/assign`,
        method: 'POST',
        body: { driverId },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'DeliveryTask', id: taskId },
        { type: 'DeliveryTask', id: 'LIST' },
      ],
    }),

    // Update task status
    updateTaskStatus: builder.mutation({
      query: ({ id, status, location, notes, photo }) => ({
        url: `deliveries/tasks/${id}/status`,
        method: 'POST',
        body: { status, location, notes, photo },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'DeliveryTask', id },
        { type: 'DeliveryTask', id: 'LIST' },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    // Get delivery routes for driver
    getDriverRoutes: builder.query({
      query: ({ driverId, date }) => {
        const params = new URLSearchParams({
          ...(date && { date }),
        });
        return `deliveries/drivers/${driverId}/routes?${params}`;
      },
      providesTags: (result, error, { driverId, date }) => [
        { type: 'DeliveryRoute', id: `${driverId}-${date}` }
      ],
    }),

    // Optimize delivery route
    optimizeRoute: builder.mutation({
      query: ({ driverId, taskIds }) => ({
        url: `deliveries/routes/optimize`,
        method: 'POST',
        body: { driverId, taskIds },
      }),
      invalidatesTags: (result, error, { driverId }) => [
        { type: 'DeliveryRoute', id: `${driverId}` },
        { type: 'DeliveryTask', id: 'LIST' },
      ],
    }),

    // Get delivery analytics
    getDeliveryAnalytics: builder.query({
      query: ({ startDate, endDate, driverId } = {}) => {
        const params = new URLSearchParams({
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          ...(driverId && { driverId }),
        });
        return `deliveries/analytics?${params}`;
      },
      providesTags: ['DeliveryAnalytics'],
    }),

    // Get all drivers
    getDrivers: builder.query({
      query: ({ active = true } = {}) => {
        const params = new URLSearchParams({
          active: active.toString(),
        });
        return `deliveries/drivers?${params}`;
      },
      providesTags: ['Driver'],
    }),

    // Get driver performance
    getDriverPerformance: builder.query({
      query: ({ driverId, startDate, endDate }) => {
        const params = new URLSearchParams({
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        });
        return `deliveries/drivers/${driverId}/performance?${params}`;
      },
      providesTags: (result, error, { driverId }) => [
        { type: 'DriverPerformance', id: driverId }
      ],
    }),

    // Update driver location
    updateDriverLocation: builder.mutation({
      query: ({ driverId, latitude, longitude }) => ({
        url: `deliveries/drivers/${driverId}/location`,
        method: 'POST',
        body: { latitude, longitude },
      }),
      invalidatesTags: (result, error, { driverId }) => [
        { type: 'Driver', id: driverId }
      ],
    }),

    // Get delivery proof
    getDeliveryProof: builder.query({
      query: (taskId) => `deliveries/tasks/${taskId}/proof`,
      providesTags: (result, error, taskId) => [
        { type: 'DeliveryProof', id: taskId }
      ],
    }),

    // Upload delivery proof
    uploadDeliveryProof: builder.mutation({
      query: ({ taskId, proof }) => ({
        url: `deliveries/tasks/${taskId}/proof`,
        method: 'POST',
        body: proof,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'DeliveryProof', id: taskId },
        { type: 'DeliveryTask', id: taskId },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyDeliveriesQuery,
  useGetDeliveryQuery,
  useGetDeliveryByQRQuery,
  useUpdateDeliveryStatusMutation,
  useGetDeliveryTasksQuery,
  useGetDeliveryTaskQuery,
  useCreateDeliveryTaskMutation,
  useUpdateDeliveryTaskMutation,
  useAssignDriverMutation,
  useUpdateTaskStatusMutation,
  useGetDriverRoutesQuery,
  useOptimizeRouteMutation,
  useGetDeliveryAnalyticsQuery,
  useGetDriversQuery,
  useGetDriverPerformanceQuery,
  useUpdateDriverLocationMutation,
  useGetDeliveryProofQuery,
  useUploadDeliveryProofMutation,
} = deliveriesApi;
