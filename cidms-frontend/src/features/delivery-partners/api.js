import { api } from '../../app/api';

export const deliveryPartnersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all delivery partners
    getDeliveryPartners: builder.query({
      query: ({ page = 1, limit = 50, search, isActive } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search }),
          ...(isActive !== undefined && { isActive }),
        });
        return `delivery-partners?${params}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'DeliveryPartner', id })),
              { type: 'DeliveryPartner', id: 'LIST' },
            ]
          : [{ type: 'DeliveryPartner', id: 'LIST' }],
    }),

    // Get single delivery partner
    getDeliveryPartner: builder.query({
      query: (id) => `delivery-partners/${id}`,
      providesTags: (result, error, id) => [{ type: 'DeliveryPartner', id }],
    }),

    // Create delivery partner
    createDeliveryPartner: builder.mutation({
      query: (partnerData) => ({
        url: 'delivery-partners',
        method: 'POST',
        body: partnerData,
      }),
      invalidatesTags: [{ type: 'DeliveryPartner', id: 'LIST' }],
    }),

    // Update delivery partner
    updateDeliveryPartner: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `delivery-partners/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'DeliveryPartner', id },
        { type: 'DeliveryPartner', id: 'LIST' },
      ],
    }),

    // Toggle delivery partner status
    toggleDeliveryPartnerStatus: builder.mutation({
      query: (id) => ({
        url: `delivery-partners/${id}/toggle-status`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'DeliveryPartner', id },
        { type: 'DeliveryPartner', id: 'LIST' },
      ],
    }),

    // Get delivery partner performance
    getDeliveryPartnerPerformance: builder.query({
      query: ({ partnerId, startDate, endDate } = {}) => {
        const params = new URLSearchParams({
          ...(partnerId && { partnerId }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        });
        return `delivery-partners/performance?${params}`;
      },
      providesTags: ['DeliveryPartnerPerformance'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDeliveryPartnersQuery,
  useGetDeliveryPartnerQuery,
  useCreateDeliveryPartnerMutation,
  useUpdateDeliveryPartnerMutation,
  useToggleDeliveryPartnerStatusMutation,
  useGetDeliveryPartnerPerformanceQuery,
} = deliveryPartnersApi;
