import { api } from '../../app/api';

export const inventoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get inventory with filtering and pagination
    getInventory: builder.query({
      query: ({ page = 1, limit = 10, search, category, stockLevel } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search }),
          ...(category && { category }),
          ...(stockLevel && { stockLevel }),
        });
        return `/inventory?${params}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Inventory', id })),
              { type: 'Inventory', id: 'LIST' },
            ]
          : [{ type: 'Inventory', id: 'LIST' }],
    }),

    // Update inventory item
    updateInventory: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/inventory/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Inventory', id },
        { type: 'Inventory', id: 'LIST' },
        { type: 'Product', id },
      ],
    }),

    getProducts: builder.query({
      query: (params) => ({
        url: '/products',
        params,
      }),
      providesTags: ['Product'],
    }),
    getProduct: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    createProduct: builder.mutation({
      query: (data) => ({
        url: '/products',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Product'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),
    getLowStockProducts: builder.query({
      query: () => '/inventory/low-stock',
      providesTags: ['Product'],
    }),
    getStockMovements: builder.query({
      query: (params) => ({
        url: '/inventory/movements',
        params,
      }),
      providesTags: ['StockMovement'],
    }),
    createStockMovement: builder.mutation({
      query: (data) => ({
        url: '/inventory/movements',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Product', 'StockMovement'],
    }),
  }),
});

export const {
  useGetInventoryQuery,
  useUpdateInventoryMutation,
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetLowStockProductsQuery,
  useGetStockMovementsQuery,
  useCreateStockMovementMutation,
} = inventoryApi;
