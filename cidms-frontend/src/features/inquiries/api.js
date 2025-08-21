import { api } from '../../app/api';

export const inquiriesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all inquiries with filters
    getInquiries: builder.query({
      query: ({ page = 1, limit = 10, status, type, priority, assignedTo, search } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(status && { status }),
          ...(type && { type }),
          ...(priority && { priority }),
          ...(assignedTo && { assignedTo }),
          ...(search && { search }),
        });
        return `inquiries?${params}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Inquiry', id })),
              { type: 'Inquiry', id: 'LIST' },
            ]
          : [{ type: 'Inquiry', id: 'LIST' }],
    }),

    // Get single inquiry
    getInquiry: builder.query({
      query: (id) => `inquiries/${id}`,
      providesTags: (result, error, id) => [{ type: 'Inquiry', id }],
    }),

    // Create new inquiry
    createInquiry: builder.mutation({
      query: (inquiryData) => ({
        url: 'inquiries',
        method: 'POST',
        body: inquiryData,
      }),
      invalidatesTags: [{ type: 'Inquiry', id: 'LIST' }],
    }),

    // Update inquiry
    updateInquiry: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `inquiries/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Inquiry', id },
        { type: 'Inquiry', id: 'LIST' },
      ],
    }),

    // Update inquiry status
    updateInquiryStatus: builder.mutation({
      query: ({ id, status, notes }) => ({
        url: `inquiries/${id}/status`,
        method: 'POST',
        body: { status, notes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Inquiry', id },
        { type: 'Inquiry', id: 'LIST' },
      ],
    }),

    // Assign inquiry to staff
    assignInquiry: builder.mutation({
      query: ({ id, assignedTo, notes }) => ({
        url: `inquiries/${id}/assign`,
        method: 'POST',
        body: { assignedTo, notes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Inquiry', id },
        { type: 'Inquiry', id: 'LIST' },
      ],
    }),

    // Add response to inquiry
    addInquiryResponse: builder.mutation({
      query: ({ id, response }) => ({
        url: `inquiries/${id}/responses`,
        method: 'POST',
        body: response,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Inquiry', id },
        { type: 'InquiryResponse', id: `inquiry-${id}` },
      ],
    }),

    // Get inquiry responses
    getInquiryResponses: builder.query({
      query: (inquiryId) => `inquiries/${inquiryId}/responses`,
      providesTags: (result, error, inquiryId) => [
        { type: 'InquiryResponse', id: `inquiry-${inquiryId}` }
      ],
    }),

    // Close inquiry
    closeInquiry: builder.mutation({
      query: ({ id, resolution, notes }) => ({
        url: `inquiries/${id}/close`,
        method: 'POST',
        body: { resolution, notes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Inquiry', id },
        { type: 'Inquiry', id: 'LIST' },
      ],
    }),

    // Reopen inquiry
    reopenInquiry: builder.mutation({
      query: ({ id, reason }) => ({
        url: `inquiries/${id}/reopen`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Inquiry', id },
        { type: 'Inquiry', id: 'LIST' },
      ],
    }),

    // Get inquiry analytics
    getInquiryAnalytics: builder.query({
      query: ({ startDate, endDate, type, status } = {}) => {
        const params = new URLSearchParams({
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          ...(type && { type }),
          ...(status && { status }),
        });
        return `inquiries/analytics?${params}`;
      },
      providesTags: ['InquiryAnalytics'],
    }),

    // Export inquiries
    exportInquiries: builder.mutation({
      query: (filters) => ({
        url: 'inquiries/export',
        method: 'POST',
        body: filters,
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Upload inquiry attachment
    uploadInquiryAttachment: builder.mutation({
      query: ({ inquiryId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `inquiries/${inquiryId}/attachments`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { inquiryId }) => [
        { type: 'Inquiry', id: inquiryId },
      ],
    }),

    // Delete inquiry attachment
    deleteInquiryAttachment: builder.mutation({
      query: ({ inquiryId, attachmentId }) => ({
        url: `inquiries/${inquiryId}/attachments/${attachmentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { inquiryId }) => [
        { type: 'Inquiry', id: inquiryId },
      ],
    }),

    // Get inquiry templates
    getInquiryTemplates: builder.query({
      query: () => 'inquiries/templates',
      providesTags: ['InquiryTemplate'],
    }),

    // Create inquiry template
    createInquiryTemplate: builder.mutation({
      query: (template) => ({
        url: 'inquiries/templates',
        method: 'POST',
        body: template,
      }),
      invalidatesTags: ['InquiryTemplate'],
    }),

    // Send bulk response
    sendBulkResponse: builder.mutation({
      query: ({ inquiryIds, response }) => ({
        url: 'inquiries/bulk-response',
        method: 'POST',
        body: { inquiryIds, response },
      }),
      invalidatesTags: [{ type: 'Inquiry', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetInquiriesQuery,
  useGetInquiryQuery,
  useCreateInquiryMutation,
  useUpdateInquiryMutation,
  useUpdateInquiryStatusMutation,
  useAssignInquiryMutation,
  useAddInquiryResponseMutation,
  useGetInquiryResponsesQuery,
  useCloseInquiryMutation,
  useReopenInquiryMutation,
  useGetInquiryAnalyticsQuery,
  useExportInquiriesMutation,
  useUploadInquiryAttachmentMutation,
  useDeleteInquiryAttachmentMutation,
  useGetInquiryTemplatesQuery,
  useCreateInquiryTemplateMutation,
  useSendBulkResponseMutation,
} = inquiriesApi;
