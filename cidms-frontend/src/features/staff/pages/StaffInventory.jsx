import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { 
  useGetInventoryQuery, 
  useUpdateInventoryMutation,
  useCreateStockMovementMutation 
} from '../../inventory/api';
import DataTable from '../../../components/common/DataTable';
import StatusBadge from '../../../components/common/StatusBadge';
import SearchInput from '../../../components/common/SearchInput';
import StockUpdateModal from '../components/StockUpdateModal';

const StaffInventory = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading, error, refetch } = useGetInventoryQuery({
    page,
    limit: 10,
    search,
    category: categoryFilter,
    stockLevel: stockFilter,
  });

  const [updateInventory, { isLoading: isUpdating }] = useUpdateInventoryMutation();
  const [createStockMovement, { isLoading: isCreatingMovement }] = useCreateStockMovementMutation();

  const columns = [
    {
      key: 'sku',
      label: 'SKU',
      render: (product) => (
        <code className="bg-light px-2 py-1 rounded">
          {product.sku}
        </code>
      ),
    },
    {
      key: 'name',
      label: 'Product',
      render: (product) => (
        <div>
          <div className="fw-medium">{product.name}</div>
          <small className="text-muted">{product.category}</small>
        </div>
      ),
    },
    {
      key: 'currentStock',
      label: 'Current Stock',
      render: (product) => {
        const isLowStock = product.currentStock <= product.reorderLevel;
        const isOutOfStock = product.currentStock === 0;
        
        return (
          <div className="text-center">
            <span className={`badge fs-6 ${
              isOutOfStock ? 'bg-danger' :
              isLowStock ? 'bg-warning text-dark' :
              'bg-success'
            }`}>
              {product.currentStock}
            </span>
            <div className="small text-muted mt-1">
              Unit: {product.unit}
            </div>
          </div>
        );
      },
    },
    {
      key: 'reorderLevel',
      label: 'Reorder Level',
      render: (product) => (
        <span className="text-center d-block">
          {product.reorderLevel}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (product) => {
        if (product.currentStock === 0) {
          return <StatusBadge status="OUT_OF_STOCK" type="inventory" />;
        } else if (product.currentStock <= product.reorderLevel) {
          return <StatusBadge status="LOW_STOCK" type="inventory" />;
        }
        return <StatusBadge status="IN_STOCK" type="inventory" />;
      },
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      render: (product) => (
        <div>
          <div>{new Date(product.lastUpdated).toLocaleDateString()}</div>
          <small className="text-muted">
            {new Date(product.lastUpdated).toLocaleTimeString()}
          </small>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (product) => (
        <div className="dropdown">
          <button
            className="btn btn-sm btn-outline-secondary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
          >
            Actions
          </button>
          <ul className="dropdown-menu">
            <li>
              <button
                className="dropdown-item"
                onClick={() => {
                  setSelectedProduct(product);
                  setShowStockModal(true);
                }}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Update Stock
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                onClick={() => handleQuickRestock(product)}
              >
                <i className="bi bi-arrow-up-circle me-2"></i>
                Quick Restock
              </button>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  const handleQuickRestock = async (product) => {
    const restockQuantity = product.reorderLevel * 2;
    
    try {
      await createStockMovement({
        productId: product.id,
        type: 'INBOUND',
        quantity: restockQuantity,
        reason: 'RESTOCK',
        notes: 'Quick restock by staff',
      }).unwrap();

      await updateInventory({
        id: product.id,
        currentStock: product.currentStock + restockQuantity,
      }).unwrap();

      enqueueSnackbar(
        `Added ${restockQuantity} ${product.unit} to ${product.name}`,
        { variant: 'success' }
      );

      refetch();
    } catch (error) {
      enqueueSnackbar('Failed to restock product', { variant: 'error' });
    }
  };

  const stockFilterOptions = [
    { value: '', label: 'All Stock Levels' },
    { value: 'out_of_stock', label: 'Out of Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'in_stock', label: 'In Stock' },
  ];

  const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Home & Garden'];

  return (
    <div className="staff-inventory">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Inventory Management</h1>
        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedProduct(null);
              setShowStockModal(true);
            }}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Stock Movement
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
          <div className="card bg-danger bg-opacity-10 border-danger border-opacity-25">
            <div className="card-body text-center py-3">
              <i className="bi bi-exclamation-triangle text-danger fs-4"></i>
              <h6 className="mt-2 mb-1">Out of Stock</h6>
              <p className="text-muted mb-0 small">Items needing immediate attention</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning bg-opacity-10 border-warning border-opacity-25">
            <div className="card-body text-center py-3">
              <i className="bi bi-exclamation-circle text-warning fs-4"></i>
              <h6 className="mt-2 mb-1">Low Stock</h6>
              <p className="text-muted mb-0 small">Items below reorder level</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success bg-opacity-10 border-success border-opacity-25">
            <div className="card-body text-center py-3">
              <i className="bi bi-check-circle text-success fs-4"></i>
              <h6 className="mt-2 mb-1">In Stock</h6>
              <p className="text-muted mb-0 small">Items with adequate stock</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info bg-opacity-10 border-info border-opacity-25">
            <div className="card-body text-center py-3">
              <i className="bi bi-box-seam text-info fs-4"></i>
              <h6 className="mt-2 mb-1">Total Products</h6>
              <p className="text-muted mb-0 small">Products in inventory</p>
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
                placeholder="Search by product name or SKU..."
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
              >
                {stockFilterOptions.map(option => (
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
                  setCategoryFilter('');
                  setStockFilter('');
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

      {/* Low Stock Alert */}
      {data?.data?.some(p => p.currentStock <= p.reorderLevel) && (
        <div className="alert alert-warning d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>
            <strong>Low Stock Alert!</strong> Some products are below their reorder level and need restocking.
          </div>
        </div>
      )}

      {/* Inventory Table */}
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

      {/* Stock Update Modal */}
      {showStockModal && (
        <StockUpdateModal
          product={selectedProduct}
          onClose={() => {
            setShowStockModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={() => {
            refetch();
            setShowStockModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default StaffInventory;
