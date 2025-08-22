import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap';
import { inventoryAPI } from '../../../services/api';
import { formatCurrency } from '../../../utils/helpers';
import LoadingSpinner from '../../common/LoadingSpinner';

const ProductCatalog = ({ onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getAll();
      
      // Handle pagination or direct array response
      const productList = response.data.items || response.data;
      
      // Only show active products with stock > 0
      const activeProducts = productList.filter(p => p.active && p.quantity > 0);
      setProducts(activeProducts);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(activeProducts.map(p => p.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    onAddToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images && product.images.length > 0 ? product.images[0] : null
    });
  };

  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === '' || product.category === selectedCategory)
    )
    .sort((a, b) => {
      const factor = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'price') {
        return (a.price - b.price) * factor;
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name) * factor;
      }
      return 0;
    });

  if (loading) {
    return <LoadingSpinner text="Loading products..." />;
  }

  return (
    <div>
      <div className="mb-4">
        <h3>Our Products</h3>
        <p className="text-muted">Browse and purchase products</p>
      </div>

      <div className="mb-4">
        <Row>
          <Col md={4}>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col md={3}>
            <Form.Select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Select 
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
            </Form.Select>
          </Col>
          <Col md={2} className="text-end">
            <span className="text-muted">
              {filteredProducts.length} products
            </span>
          </Col>
        </Row>
      </div>

      <Row xs={1} md={2} lg={3} xl={4} className="g-4">
        {filteredProducts.length === 0 ? (
          <Col xs={12}>
            <div className="text-center py-5">
              <i className="bi bi-search fs-1 text-muted"></i>
              <p className="mt-2 text-muted">No products found</p>
            </div>
          </Col>
        ) : (
          filteredProducts.map(product => (
            <Col key={product._id}>
              <Card className="h-100 product-card">
                <div className="product-image-container">
                  {product.images && product.images.length > 0 ? (
                    <Card.Img 
                      variant="top" 
                      src={product.images[0]} 
                      alt={product.name}
                      className="product-image"
                    />
                  ) : (
                    <div className="text-center py-5 bg-light">
                      <i className="bi bi-image fs-1 text-muted"></i>
                    </div>
                  )}
                  {product.quantity <= product.minStock && (
                    <span className="product-badge bg-warning">Low Stock</span>
                  )}
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{product.name}</Card.Title>
                  <Card.Text className="text-muted small mb-2">
                    {product.category}
                  </Card.Text>
                  <Card.Text className="product-description">
                    {product.description || 'No description available'}
                  </Card.Text>
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <span className="fw-bold fs-5">
                      {formatCurrency(product.price)}
                    </span>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                    >
                      <i className="bi bi-cart-plus me-2"></i>
                      Add to Cart
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </div>
  );
};

export default ProductCatalog;
