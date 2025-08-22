import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from '../../../utils/toast';
import LoadingBlock from '../../../components/common/LoadingBlock';
import ErrorState from '../../../components/common/ErrorState';
import LowStockAlert from '../../../components/common/LowStockAlert';
import QRCodeBlock from '../../../components/common/QRCodeBlock';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [stockHistory, setStockHistory] = useState([]);
  
  useEffect(() => {
    // Simulate API call to fetch product details
    setLoading(true);
    setTimeout(() => {
      try {
        // Mock data for demonstration
        const productData = {
          id,
          name: 'Premium Laptop XPS-15',
          sku: 'LAP-XPS15-2025',
          description: 'High-performance laptop with 16GB RAM, 1TB SSD, and dedicated graphics card.',
          price: 1299.99,
          cost: 950.00,
          category: 'Electronics',
          supplier: 'Tech Supplies Inc.',
          inStock: 12,
          lowStockThreshold: 15,
          location: 'Warehouse A, Shelf 3, Row 2',
          dimensions: '14.5 x 9.7 x 0.7 inches',
          weight: '4.5 lbs',
          images: [
            'https://via.placeholder.com/500x300?text=Product+Image+1',
            'https://via.placeholder.com/500x300?text=Product+Image+2'
          ],
          barcode: id,
          tags: ['laptop', 'electronics', 'computer'],
          lastUpdated: '2025-08-15T10:30:00'
        };
        
        // Stock movement history
        const mockStockHistory = [
          { 
            id: 'STKMV001', 
            date: '2025-08-15T14:30:00', 
            type: 'incoming', 
            quantity: 10, 
            source: 'Supplier Delivery', 
            reference: 'PO-2025-055' 
          },
          { 
            id: 'STKMV002', 
            date: '2025-08-16T09:15:00', 
            type: 'outgoing', 
            quantity: 2, 
            source: 'Customer Order', 
            reference: 'ORD-2025-122' 
          },
          { 
            id: 'STKMV003', 
            date: '2025-08-17T11:45:00', 
            type: 'adjustment', 
            quantity: -1, 
            source: 'Inventory Count', 
            reference: 'ADJ-2025-013' 
          },
          { 
            id: 'STKMV004', 
            date: '2025-08-20T16:20:00', 
            type: 'incoming', 
            quantity: 5, 
            source: 'Returned Items', 
            reference: 'RET-2025-007' 
          }
        ];
        
        setProduct(productData);
        setStockHistory(mockStockHistory);
        setEditForm(productData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details. Please try again later.');
        setLoading(false);
      }
    }, 1000);
  }, [id]);
  
  const handleUpdateStock = (quantity, reason) => {
    setLoading(true);
    
    // Simulate API call to update stock
    setTimeout(() => {
      const newStock = product.inStock + quantity;
      setProduct({
        ...product,
        inStock: newStock
      });
      
      // Add to stock history
      const newStockEntry = {
        id: `STKMV${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString(),
        type: quantity > 0 ? 'incoming' : 'outgoing',
        quantity: Math.abs(quantity),
        source: reason,
        reference: `MAN-${Math.floor(1000 + Math.random() * 9000)}`
      };
      
      setStockHistory([newStockEntry, ...stockHistory]);
      setLoading(false);
      toast.success(`Stock updated successfully. New stock: ${newStock}`);
    }, 800);
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value
    });
  };
  
  const handleSaveChanges = () => {
    setLoading(true);
    
    // Simulate API call to save product changes
    setTimeout(() => {
      setProduct(editForm);
      setIsEditing(false);
      setLoading(false);
      toast.success('Product updated successfully');
    }, 1000);
  };
  
  const handleDeleteProduct = () => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      setLoading(true);
      
      // Simulate API call to delete product
      setTimeout(() => {
        toast.success('Product deleted successfully');
        navigate('/admin/inventory');
      }, 1000);
    }
  };
  
  if (loading) return <LoadingBlock text="Loading product details..." />;
  if (error) return <ErrorState message={error} />;
  if (!product) return <ErrorState message="Product not found" />;
  
  return (
    <div className="product-detail-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{product.name}</h1>
        <div className="btn-group">
          <button 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/admin/inventory')}
          >
            Back to Inventory
          </button>
          {!isEditing ? (
            <button 
              className="btn btn-outline-primary"
              onClick={() => setIsEditing(true)}
            >
              Edit Product
            </button>
          ) : (
            <button 
              className="btn btn-primary"
              onClick={handleSaveChanges}
            >
              Save Changes
            </button>
          )}
        </div>
      </div>
      
      {product.inStock < product.lowStockThreshold && (
        <LowStockAlert 
          current={product.inStock} 
          threshold={product.lowStockThreshold}
          className="mb-4"
        />
      )}
      
      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">Product Details</h5>
            </div>
            <div className="card-body">
              {isEditing ? (
                <form>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="name" className="form-label">Product Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={editForm.name}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="sku" className="form-label">SKU</label>
                      <input
                        type="text"
                        className="form-control"
                        id="sku"
                        name="sku"
                        value={editForm.sku}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      id="description"
                      name="description"
                      rows="3"
                      value={editForm.description}
                      onChange={handleFormChange}
                    ></textarea>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label htmlFor="price" className="form-label">Selling Price ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="price"
                        name="price"
                        value={editForm.price}
                        onChange={handleFormChange}
                        step="0.01"
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="cost" className="form-label">Cost Price ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="cost"
                        name="cost"
                        value={editForm.cost}
                        onChange={handleFormChange}
                        step="0.01"
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="lowStockThreshold" className="form-label">Low Stock Threshold</label>
                      <input
                        type="number"
                        className="form-control"
                        id="lowStockThreshold"
                        name="lowStockThreshold"
                        value={editForm.lowStockThreshold}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="category" className="form-label">Category</label>
                      <input
                        type="text"
                        className="form-control"
                        id="category"
                        name="category"
                        value={editForm.category}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="supplier" className="form-label">Supplier</label>
                      <input
                        type="text"
                        className="form-control"
                        id="supplier"
                        name="supplier"
                        value={editForm.supplier}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="location" className="form-label">Storage Location</label>
                      <input
                        type="text"
                        className="form-control"
                        id="location"
                        name="location"
                        value={editForm.location}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="col-md-3">
                      <label htmlFor="dimensions" className="form-label">Dimensions</label>
                      <input
                        type="text"
                        className="form-control"
                        id="dimensions"
                        name="dimensions"
                        value={editForm.dimensions}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="col-md-3">
                      <label htmlFor="weight" className="form-label">Weight</label>
                      <input
                        type="text"
                        className="form-control"
                        id="weight"
                        name="weight"
                        value={editForm.weight}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <p><strong>SKU:</strong> {product.sku}</p>
                      <p><strong>Category:</strong> {product.category}</p>
                      <p><strong>Supplier:</strong> {product.supplier}</p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Selling Price:</strong> ${product.price.toFixed(2)}</p>
                      <p><strong>Cost Price:</strong> ${product.cost.toFixed(2)}</p>
                      <p><strong>Profit Margin:</strong> ${(product.price - product.cost).toFixed(2)} ({Math.round((product.price - product.cost) / product.price * 100)}%)</p>
                    </div>
                  </div>
                  
                  <h6 className="mb-2">Description</h6>
                  <p className="mb-4">{product.description}</p>
                  
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <h6 className="mb-2">Storage</h6>
                      <p><strong>Location:</strong> {product.location}</p>
                    </div>
                    <div className="col-md-4">
                      <h6 className="mb-2">Physical Attributes</h6>
                      <p><strong>Dimensions:</strong> {product.dimensions}</p>
                      <p><strong>Weight:</strong> {product.weight}</p>
                    </div>
                    <div className="col-md-4">
                      <h6 className="mb-2">Tags</h6>
                      <div>
                        {product.tags.map((tag, index) => (
                          <span key={index} className="badge bg-secondary me-1 mb-1">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="card mb-4">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Stock History</h5>
              <button 
                className="btn btn-sm btn-outline-primary"
                data-bs-toggle="modal"
                data-bs-target="#stockUpdateModal"
              >
                <i className="bi bi-plus-circle me-1"></i>
                Update Stock
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Source</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockHistory.map(entry => (
                      <tr key={entry.id}>
                        <td>{new Date(entry.date).toLocaleDateString()}</td>
                        <td>
                          {entry.type === 'incoming' && <span className="badge bg-success">Incoming</span>}
                          {entry.type === 'outgoing' && <span className="badge bg-danger">Outgoing</span>}
                          {entry.type === 'adjustment' && <span className="badge bg-warning text-dark">Adjustment</span>}
                        </td>
                        <td>{entry.quantity}</td>
                        <td>{entry.source}</td>
                        <td>{entry.reference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">Stock Information</h5>
            </div>
            <div className="card-body text-center">
              <h2 className="display-4">{product.inStock}</h2>
              <p className="mb-3">Units in Stock</p>
              <div className="progress mb-3" style={{ height: '20px' }}>
                <div 
                  className={`progress-bar ${product.inStock < product.lowStockThreshold ? 'bg-danger' : 'bg-success'}`}
                  role="progressbar" 
                  style={{ width: `${Math.min((product.inStock / (product.lowStockThreshold * 2)) * 100, 100)}%` }}
                  aria-valuenow={product.inStock}
                  aria-valuemin="0" 
                  aria-valuemax={product.lowStockThreshold * 2}
                ></div>
              </div>
              <p className="mb-0">
                <small>Low stock threshold: {product.lowStockThreshold}</small>
              </p>
              <hr />
              <div className="d-flex justify-content-between">
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => navigate(`/admin/orders/create?productId=${product.id}`)}
                >
                  <i className="bi bi-cart-plus me-1"></i>
                  New Order
                </button>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={handleDeleteProduct}
                >
                  <i className="bi bi-trash me-1"></i>
                  Delete Product
                </button>
              </div>
            </div>
          </div>
          
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">Product Images</h5>
            </div>
            <div className="card-body">
              {product.images.map((image, index) => (
                <img 
                  key={index}
                  src={image} 
                  alt={`Product Image ${index + 1}`} 
                  className="img-fluid mb-2 rounded"
                />
              ))}
              {isEditing && (
                <div className="mt-3">
                  <button className="btn btn-outline-secondary btn-sm w-100">
                    <i className="bi bi-upload me-1"></i>
                    Upload New Image
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="card">
            <div className="card-header bg-light">
              <h5 className="mb-0">Product QR Code</h5>
            </div>
            <div className="card-body text-center">
              <QRCodeBlock 
                data={`product:${product.id}`}
                label={product.name}
                subLabel={product.sku}
                size={150}
              />
              <button className="btn btn-outline-secondary btn-sm mt-3">
                <i className="bi bi-printer me-1"></i>
                Print QR Code
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stock Update Modal */}
      <div className="modal fade" id="stockUpdateModal" tabIndex="-1" aria-labelledby="stockUpdateModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="stockUpdateModalLabel">Update Stock</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form>
                <div className="mb-3">
                  <label htmlFor="stockChange" className="form-label">Stock Change</label>
                  <div className="input-group">
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary" 
                      id="stockDecreaseBtn"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      className="form-control text-center" 
                      id="stockChange" 
                      defaultValue="1"
                    />
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary" 
                      id="stockIncreaseBtn"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="stockChangeReason" className="form-label">Reason</label>
                  <select className="form-select" id="stockChangeReason">
                    <option value="Supplier Delivery">Supplier Delivery</option>
                    <option value="Customer Order">Customer Order</option>
                    <option value="Stock Count Adjustment">Stock Count Adjustment</option>
                    <option value="Damaged Stock">Damaged Stock</option>
                    <option value="Returns">Returns</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="stockChangeNotes" className="form-label">Notes (Optional)</label>
                  <textarea className="form-control" id="stockChangeNotes" rows="3"></textarea>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => handleUpdateStock(5, 'Supplier Delivery')}
                data-bs-dismiss="modal"
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ProductDetail;
