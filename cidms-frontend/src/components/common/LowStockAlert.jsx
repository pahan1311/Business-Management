import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetLowStockQuery } from '../../features/inventory/api';
import { useSocket } from '../../hooks/useSocket';

const LowStockAlert = () => {
  const { data, isLoading, error } = useGetLowStockQuery();
  const [lowStockItems, setLowStockItems] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    if (data?.lowStock) {
      setLowStockItems(data.lowStock);
    }
  }, [data]);

  useEffect(() => {
    if (socket) {
      // Listen for real-time low stock alerts
      const handleLowStock = (data) => {
        if (data.products && Array.isArray(data.products)) {
          setLowStockItems(prevItems => {
            // Merge new products with existing ones, avoiding duplicates
            const currentIds = new Set(prevItems.map(item => item.id));
            const newItems = data.products.filter(product => !currentIds.has(product.id));
            return [...prevItems, ...newItems];
          });
        }
      };

      // Listen for single low stock item alerts
      const handleLowStockItem = (data) => {
        if (data.product) {
          setLowStockItems(prevItems => {
            // Check if product already exists in the list
            const exists = prevItems.some(item => item.id === data.product.id);
            if (exists) {
              // Update the existing product
              return prevItems.map(item => 
                item.id === data.product.id ? data.product : item
              );
            } else {
              // Add the new product
              return [...prevItems, data.product];
            }
          });
        }
      };

      socket.on('inventory:low-stock', handleLowStock);
      socket.on('inventory:low-stock-item', handleLowStockItem);

      return () => {
        socket.off('inventory:low-stock', handleLowStock);
        socket.off('inventory:low-stock-item', handleLowStockItem);
      };
    }
  }, [socket]);

  if (isLoading) {
    return (
      <div className="card border-warning mb-4">
        <div className="card-header bg-warning text-white">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Low Stock Alerts
        </div>
        <div className="card-body">
          <p className="text-center">
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            &nbsp; Loading alerts...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-danger mb-4">
        <div className="card-header bg-danger text-white">
          <i className="bi bi-exclamation-circle me-2"></i>
          Error Loading Alerts
        </div>
        <div className="card-body">
          <p>Failed to load low stock alerts. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  if (!lowStockItems || lowStockItems.length === 0) {
    return (
      <div className="card border-success mb-4">
        <div className="card-header bg-success text-white">
          <i className="bi bi-check-circle me-2"></i>
          Stock Levels
        </div>
        <div className="card-body">
          <p className="text-center">All products are at healthy stock levels.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-warning mb-4">
      <div className="card-header bg-warning text-white">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Low Stock Alerts ({lowStockItems.length})
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Current Stock</th>
                <th>Reorder Point</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.sku}</td>
                  <td>
                    <span className="badge bg-danger">
                      {item.onHand}
                    </span>
                  </td>
                  <td>{item.reorderPoint}</td>
                  <td>
                    <Link 
                      to={`/admin/products/${item.id}`} 
                      className="btn btn-sm btn-outline-primary"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card-footer">
        <Link to="/admin/inventory" className="btn btn-sm btn-warning">
          Manage Inventory
        </Link>
      </div>
    </div>
  );
};

export default LowStockAlert;
