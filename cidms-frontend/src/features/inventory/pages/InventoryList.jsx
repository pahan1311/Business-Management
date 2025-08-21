import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGetProductsQuery, useDeleteProductMutation } from '../api';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { formatCurrency } from '../../../utils/format';
import { useSnackbar } from 'notistack';

const InventoryList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const { data, isLoading, error, refetch } = useGetProductsQuery({
    page,
    limit: 25,
    search,
    ...filters,
  });

  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const getStockStatus = (product) => {
    if (product.onHand === 0) return { status: 'OUT', type: 'stock' };
    if (product.onHand <= product.reorderPoint) return { status: 'LOW', type: 'stock' };
    return { status: 'OK', type: 'stock' };
  };

  const columns = [
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
    },
    {
      key: 'name',
      label: 'Product Name',
      sortable: true,
      render: (value, product) => (
        <Link to={`/admin/products/${product.id}`} className="text-decoration-none">
          {value}
        </Link>
      ),
    },
    {
      key: 'onHand',
      label: 'On Hand',
      sortable: true,
      render: (value) => (
        <span className="fw-bold">{value || 0}</span>
      ),
    },
    {
      key: 'reserved',
      label: 'Reserved',
      render: (value) => value || 0,
    },
    {
      key: 'available',
      label: 'Available',
      render: (_, product) => (product.onHand || 0) - (product.reserved || 0),
    },
    {
      key: 'reorderPoint',
      label: 'Reorder Point',
      render: (value) => value || 0,
    },
    {
      key: 'unitPrice',
      label: 'Unit Price',
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: 'status',
      label: 'Stock Status',
      render: (_, product) => {
        const { status, type } = getStockStatus(product);
        return <StatusBadge status={status} type={type} />;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, product) => (
        <div className="btn-group" role="group">
          <Link
            to={`/admin/products/${product.id}`}
            className="btn btn-sm btn-outline-primary"
          >
            <i className="bi bi-eye"></i>
          </Link>
          <Link
            to={`/admin/products/${product.id}/edit`}
            className="btn btn-sm btn-outline-secondary"
          >
            <i className="bi bi-pencil"></i>
          </Link>
          <button
            className="btn btn-sm btn-outline-success"
            onClick={() => navigate(`/admin/inventory/adjust?productId=${product.id}`)}
          >
            <i className="bi bi-arrow-up-down"></i>
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => setDeleteId(product.id)}
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      ),
    },
  ];

  const handleDelete = async () => {
    try {
      await deleteProduct(deleteId).unwrap();
      enqueueSnackbar('Product deleted successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to delete product', { variant: 'error' });
    }
  };

  const handleRowClick = (product) => {
    navigate(`/admin/products/${product.id}`);
  };

  const actions = (
    <div className="btn-group">
      <Link to="/admin/products/new" className="btn btn-primary">
        <i className="bi bi-plus-circle me-2"></i>
        Add Product
      </Link>
      <Link to="/admin/inventory/movements" className="btn btn-outline-secondary">
        <i className="bi bi-arrow-up-down me-2"></i>
        Stock Movements
      </Link>
    </div>
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Inventory Management</h1>
      </div>

      {/* Filter Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${!filters.lowStock ? 'active' : ''}`}
            onClick={() => setFilters({})}
          >
            All Products
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${filters.lowStock ? 'active' : ''}`}
            onClick={() => setFilters({ lowStock: true })}
          >
            <i className="bi bi-exclamation-triangle me-2"></i>
            Low Stock
          </button>
        </li>
      </ul>

      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        pagination={{
          currentPage: page,
          totalPages: data?.totalPages || 1,
          total: data?.total || 0,
        }}
        onPageChange={setPage}
        onSearch={setSearch}
        onRowClick={handleRowClick}
        searchable
        actions={actions}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        variant="danger"
      />
    </div>
  );
};

export default InventoryList;
