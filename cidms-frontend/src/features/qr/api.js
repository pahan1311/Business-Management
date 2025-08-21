import { api } from '../../app/api';

export const qrApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Generate QR code for order
    generateOrderQR: builder.mutation({
      query: ({ orderId, options = {} }) => ({
        url: `qr/order/${orderId}`,
        method: 'POST',
        body: options,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'QRCode', id: `order-${orderId}` },
      ],
    }),

    // Generate QR code for product
    generateProductQR: builder.mutation({
      query: ({ productId, options = {} }) => ({
        url: `qr/product/${productId}`,
        method: 'POST',
        body: options,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'QRCode', id: `product-${productId}` },
      ],
    }),

    // Generate QR code for delivery
    generateDeliveryQR: builder.mutation({
      query: ({ deliveryId, options = {} }) => ({
        url: `qr/delivery/${deliveryId}`,
        method: 'POST',
        body: options,
      }),
      invalidatesTags: (result, error, { deliveryId }) => [
        { type: 'QRCode', id: `delivery-${deliveryId}` },
      ],
    }),

    // Generate custom QR code
    generateCustomQR: builder.mutation({
      query: ({ data, type, options = {} }) => ({
        url: 'qr/generate',
        method: 'POST',
        body: { data, type, options },
      }),
    }),

    // Scan QR code and get information
    scanQRCode: builder.mutation({
      query: ({ qrData, context = 'general' }) => ({
        url: 'qr/scan',
        method: 'POST',
        body: { qrData, context },
      }),
    }),

    // Track QR code scan
    trackQRScan: builder.mutation({
      query: ({ qrId, scanData }) => ({
        url: `qr/${qrId}/track`,
        method: 'POST',
        body: scanData,
      }),
    }),

    // Get QR code analytics
    getQRAnalytics: builder.query({
      query: ({ type, startDate, endDate } = {}) => {
        const params = new URLSearchParams({
          ...(type && { type }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        });
        return `qr/analytics?${params}`;
      },
      providesTags: ['QRAnalytics'],
    }),

    // Get QR code details
    getQRCode: builder.query({
      query: (qrId) => `qr/${qrId}`,
      providesTags: (result, error, qrId) => [
        { type: 'QRCode', id: qrId }
      ],
    }),

    // Update QR code
    updateQRCode: builder.mutation({
      query: ({ qrId, ...patch }) => ({
        url: `qr/${qrId}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { qrId }) => [
        { type: 'QRCode', id: qrId },
      ],
    }),

    // Deactivate QR code
    deactivateQRCode: builder.mutation({
      query: (qrId) => ({
        url: `qr/${qrId}/deactivate`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, qrId) => [
        { type: 'QRCode', id: qrId },
      ],
    }),

    // Get QR code scan history
    getQRScanHistory: builder.query({
      query: ({ qrId, page = 1, limit = 10 }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        return `qr/${qrId}/scans?${params}`;
      },
      providesTags: (result, error, { qrId }) => [
        { type: 'QRScanHistory', id: qrId }
      ],
    }),

    // Batch generate QR codes
    batchGenerateQR: builder.mutation({
      query: ({ items, type, options = {} }) => ({
        url: 'qr/batch-generate',
        method: 'POST',
        body: { items, type, options },
      }),
    }),

    // Export QR codes
    exportQRCodes: builder.mutation({
      query: ({ qrIds, format = 'pdf' }) => ({
        url: 'qr/export',
        method: 'POST',
        body: { qrIds, format },
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Validate QR code
    validateQRCode: builder.mutation({
      query: ({ qrData, validationType = 'order' }) => ({
        url: 'qr/validate',
        method: 'POST',
        body: { qrData, validationType },
      }),
    }),

    // Get QR templates
    getQRTemplates: builder.query({
      query: ({ type } = {}) => {
        const params = new URLSearchParams({
          ...(type && { type }),
        });
        return `qr/templates?${params}`;
      },
      providesTags: ['QRTemplate'],
    }),

    // Create QR template
    createQRTemplate: builder.mutation({
      query: (template) => ({
        url: 'qr/templates',
        method: 'POST',
        body: template,
      }),
      invalidatesTags: ['QRTemplate'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGenerateOrderQRMutation,
  useGenerateProductQRMutation,
  useGenerateDeliveryQRMutation,
  useGenerateCustomQRMutation,
  useScanQRCodeMutation,
  useTrackQRScanMutation,
  useGetQRAnalyticsQuery,
  useGetQRCodeQuery,
  useUpdateQRCodeMutation,
  useDeactivateQRCodeMutation,
  useGetQRScanHistoryQuery,
  useBatchGenerateQRMutation,
  useExportQRCodesMutation,
  useValidateQRCodeMutation,
  useGetQRTemplatesQuery,
  useCreateQRTemplateMutation,
} = qrApi;
