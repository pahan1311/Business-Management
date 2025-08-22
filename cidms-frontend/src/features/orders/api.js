import { api } from '../../app/api';

export const ordersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all orders with filters
    getOrders: builder.query({
      query: ({ page = 1, limit = 10, status, customerId, search } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(status && { status }),
          ...(customerId && { customerId }),
          ...(search && { search }),
        });
        return `orders?${params}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Order', id })),
              { type: 'Order', id: 'LIST' },
            ]
          : [{ type: 'Order', id: 'LIST' }],
    }),

    // Get single order
    getOrder: builder.query({
      query: (id) => `orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),

    // Create new order
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: 'orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: [
        { type: 'Order', id: 'LIST' },
        { type: 'Product', id: 'LIST' }, // Update product stock
      ],
    }),

    // Update order
    updateOrder: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `orders/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    // Cancel order
    cancelOrder: builder.mutation({
      query: ({ id, reason }) => ({
        url: `orders/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
        { type: 'Product', id: 'LIST' }, // Update product stock
      ],
    }),

    // Update order status
    updateOrderStatus: builder.mutation({
      query: ({ id, status, notes }) => ({
        url: `orders/${id}/status`,
        method: 'POST',
        body: { status, notes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    // Assign order to delivery partner
    assignOrder: builder.mutation({
      query: ({ orderId, partnerId, instructions, expectedDeliveryDate }) => ({
        url: `orders/${orderId}/assign`,
        method: 'POST',
        body: { 
          partnerId, 
          instructions: instructions || null,
          expectedDeliveryDate: expectedDeliveryDate || null 
        },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'Order', id: 'LIST' },
        { type: 'Delivery', id: 'LIST' },
      ],
    }),

    // Get order tracking
    getOrderTracking: builder.query({
      query: (orderNumber) => `orders/tracking/${orderNumber}`,
      providesTags: (result, error, orderNumber) => [
        { type: 'OrderTracking', id: orderNumber }
      ],
    }),

    // Add tracking update
    addTrackingUpdate: builder.mutation({
      query: ({ orderId, update }) => ({
        url: `orders/${orderId}/tracking`,
        method: 'POST',
        body: update,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'OrderTracking', id: result?.orderNumber },
      ],
    }),

    // Get order analytics
    getOrderAnalytics: builder.query({
      query: ({ startDate, endDate, customerId } = {}) => {
        const params = new URLSearchParams({
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          ...(customerId && { customerId }),
        });
        return `orders/analytics?${params}`;
      },
      providesTags: ['OrderAnalytics'],
    }),

    // Duplicate order
    duplicateOrder: builder.mutation({
      query: (id) => ({
        url: `orders/${id}/duplicate`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),

    // Export orders
    exportOrders: builder.mutation({
      query: (filters) => ({
        url: 'orders/export',
        method: 'POST',
        body: filters,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useCancelOrderMutation,
  useUpdateOrderStatusMutation,
  useAssignOrderMutation,
  useGetOrderTrackingQuery,
  useAddTrackingUpdateMutation,
  useGetOrderAnalyticsQuery,
  useDuplicateOrderMutation,
  useExportOrdersMutation,
} = ordersApi;
