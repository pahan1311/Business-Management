import { api } from '../../app/api';

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardMetrics: builder.query({
      query: () => '/metrics/dashboard',
      providesTags: ['Dashboard'],
    }),
    getReports: builder.query({
      query: (params) => ({
        url: '/reports',
        params,
      }),
      providesTags: ['Reports'],
    }),
    getAuditLogs: builder.query({
      query: (params) => ({
        url: '/audit-logs',
        params,
      }),
      providesTags: ['AuditLogs'],
    }),
    getSettings: builder.query({
      query: () => '/settings',
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation({
      query: (data) => ({
        url: '/settings',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const {
  useGetDashboardMetricsQuery,
  useGetReportsQuery,
  useGetAuditLogsQuery,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} = adminApi;
