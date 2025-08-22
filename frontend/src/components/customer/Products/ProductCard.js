import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { formatCurrency } from '../../../utils/helpers';

const ProductCard = ({ product, onAddToCart }) => {
  const { _id, name, description, price, imageUrl, category, stock } = product;

  // Determine stock status and badge color
  const getStockStatus = () => {
    if (stock <= 0) {
      return { text: 'Out of Stock', color: 'danger' };
    } else if (stock < 10) {
      return { text: 'Low Stock', color: 'warning' };
    } else {
      return { text: 'In Stock', color: 'success' };
    }
  };

  const stockStatus = getStockStatus();

  // Truncate description for display
  const truncateDescription = (text, maxLength = 80) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const handleAddToCart = () => {
    if (stock > 0) {
      onAddToCart({
        productId: _id,
        name,
        price,
        image: imageUrl,
        quantity: 1,
        stock
      });
    }
  };

  return (
    <Card className="h-100 product-card">
      <div className="product-image-container">
        {imageUrl ? (
          <Card.Img
            variant="top"
            src={imageUrl}
            alt={name}
            className="product-image"
          />
        ) : (
          <div className="product-image-placeholder d-flex align-items-center justify-content-center bg-light">
            <i className="bi bi-image text-muted" style={{ fontSize: '2rem' }}></i>
          </div>
        )}
        {category && (
          <Badge 
            bg="primary" 
            className="position-absolute top-0 start-0 m-2"
          >
            {category}
          </Badge>
        )}
      </div>
      
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-1">
          <Card.Title className="mb-0 h5">{name}</Card.Title>
          <Badge bg={stockStatus.color} className="ms-1">
            {stockStatus.text}
          </Badge>
        </div>
        
        <Card.Text className="text-muted small mb-2">
          {truncateDescription(description)}
        </Card.Text>
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold fs-5">{formatCurrency(price)}</span>
            {stock > 0 && (
              <small className="text-muted">
                {stock} {stock === 1 ? 'unit' : 'units'} available
              </small>
            )}
          </div>
          
          <Button
            variant={stock > 0 ? 'primary' : 'secondary'}
            className="w-100"
            onClick={handleAddToCart}
            disabled={stock <= 0}
          >
            {stock > 0 ? (
              <>
                <i className="bi bi-cart-plus me-2"></i>
                Add to Cart
              </>
            ) : 'Out of Stock'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
