import React, { useState } from 'react';
import { Card, ListGroup, Button, Form, Modal } from 'react-bootstrap';
import { orderAPI } from '../../../services/api';
import { formatCurrency } from '../../../utils/helpers';
import { useAuth } from '../../../hooks/useAuth';

const ShoppingCart = ({ cartItems, updateQuantity, removeFromCart, clearCart }) => {
  const { user } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderForm, setOrderForm] = useState({
    deliveryAddress: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zip: user?.address?.zip || '',
      country: user?.address?.country || ''
    },
    paymentMethod: 'cash',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setOrderForm({
        ...orderForm,
        [parent]: {
          ...orderForm[parent],
          [child]: value
        }
      });
    } else {
      setOrderForm({
        ...orderForm,
        [name]: value
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!orderForm.deliveryAddress.street.trim()) {
      errors['deliveryAddress.street'] = 'Street address is required';
    }
    
    if (!orderForm.deliveryAddress.city.trim()) {
      errors['deliveryAddress.city'] = 'City is required';
    }
    
    if (!orderForm.deliveryAddress.state.trim()) {
      errors['deliveryAddress.state'] = 'State is required';
    }
    
    if (!orderForm.deliveryAddress.zip.trim()) {
      errors['deliveryAddress.zip'] = 'ZIP code is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      const orderData = {
        customer: user.id,
        items: cartItems.map(item => ({
          product: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount,
        paymentMethod: orderForm.paymentMethod,
        deliveryAddress: orderForm.deliveryAddress,
        notes: orderForm.notes
      };
      
      const response = await orderAPI.create(orderData);
      setOrderSuccess(true);
      setOrderNumber(response.data._id);
      clearCart();
      
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    if (orderSuccess) {
      setShowCheckout(false);
      setOrderSuccess(false);
      setOrderNumber(null);
    }
  };

  return (
    <>
      <Card>
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-cart me-2"></i>
              Shopping Cart
            </h5>
            <span className="badge bg-white text-primary">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </Card.Header>
        <Card.Body>
          {cartItems.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-cart fs-1 text-muted"></i>
              <p className="mt-3 text-muted">Your cart is empty</p>
              <p className="text-muted small">Add products to your cart to proceed with checkout</p>
            </div>
          ) : (
            <>
              <ListGroup variant="flush">
                {cartItems.map((item, index) => (
                  <ListGroup.Item key={index}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="cart-item-image me-3"
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div 
                            className="bg-light d-flex align-items-center justify-content-center me-3"
                            style={{ width: '40px', height: '40px' }}
                          >
                            <i className="bi bi-image text-muted"></i>
                          </div>
                        )}
                        <div>
                          <h6 className="mb-0">{item.name}</h6>
                          <small className="text-muted">
                            {formatCurrency(item.price)} each
                          </small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="input-group input-group-sm" style={{ width: '100px' }}>
                          <Button 
                            variant="outline-secondary"
                            onClick={() => updateQuantity(index, Math.max(1, item.quantity - 1))}
                          >
                            -
                          </Button>
                          <Form.Control
                            type="text"
                            className="text-center"
                            value={item.quantity}
                            readOnly
                          />
                          <Button 
                            variant="outline-secondary"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <Button 
                          variant="link" 
                          className="text-danger ms-2 p-0" 
                          onClick={() => removeFromCart(index)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              <div className="d-flex justify-content-between align-items-center mt-3">
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={clearCart}
                >
                  <i className="bi bi-trash me-2"></i>
                  Clear Cart
                </Button>
                <h5 className="mb-0">Total: {formatCurrency(totalAmount)}</h5>
              </div>

              <div className="d-grid mt-4">
                <Button 
                  variant="primary"
                  onClick={() => setShowCheckout(true)}
                >
                  <i className="bi bi-credit-card me-2"></i>
                  Checkout
                </Button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={showCheckout} onHide={() => setShowCheckout(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{orderSuccess ? 'Order Confirmation' : 'Checkout'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {orderSuccess ? (
            <div className="text-center py-4">
              <div className="mb-4">
                <span className="bg-success text-white p-3 rounded-circle d-inline-flex justify-content-center align-items-center" style={{ width: '80px', height: '80px' }}>
                  <i className="bi bi-check-lg fs-1"></i>
                </span>
              </div>
              <h4 className="mb-3">Thank You for Your Order!</h4>
              <p>Your order #{orderNumber} has been placed successfully.</p>
              <p>You can track your order status in the Orders section.</p>
            </div>
          ) : (
            <Form onSubmit={handleCheckout}>
              <h5>Order Summary</h5>
              <div className="bg-light p-3 mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal ({cartItems.length} items):</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Delivery Fee:</span>
                  <span>$0.00</span>
                </div>
                <div className="d-flex justify-content-between fw-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <h5>Delivery Address</h5>
              <div className="row mb-3">
                <div className="col-md-12 mb-3">
                  <Form.Label>Street Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="deliveryAddress.street"
                    value={orderForm.deliveryAddress.street}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors['deliveryAddress.street']}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors['deliveryAddress.street']}
                  </Form.Control.Feedback>
                </div>

                <div className="col-md-6 mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="deliveryAddress.city"
                    value={orderForm.deliveryAddress.city}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors['deliveryAddress.city']}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors['deliveryAddress.city']}
                  </Form.Control.Feedback>
                </div>

                <div className="col-md-4 mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    name="deliveryAddress.state"
                    value={orderForm.deliveryAddress.state}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors['deliveryAddress.state']}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors['deliveryAddress.state']}
                  </Form.Control.Feedback>
                </div>

                <div className="col-md-2 mb-3">
                  <Form.Label>ZIP Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="deliveryAddress.zip"
                    value={orderForm.deliveryAddress.zip}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors['deliveryAddress.zip']}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors['deliveryAddress.zip']}
                  </Form.Control.Feedback>
                </div>
              </div>

              <h5>Payment Method</h5>
              <div className="mb-4">
                <Form.Check
                  type="radio"
                  id="cash"
                  label="Cash on Delivery"
                  name="paymentMethod"
                  value="cash"
                  checked={orderForm.paymentMethod === 'cash'}
                  onChange={handleInputChange}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  id="credit_card"
                  label="Credit Card"
                  name="paymentMethod"
                  value="credit_card"
                  checked={orderForm.paymentMethod === 'credit_card'}
                  onChange={handleInputChange}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  id="debit_card"
                  label="Debit Card"
                  name="paymentMethod"
                  value="debit_card"
                  checked={orderForm.paymentMethod === 'debit_card'}
                  onChange={handleInputChange}
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  id="online"
                  label="Online Payment"
                  name="paymentMethod"
                  value="online"
                  checked={orderForm.paymentMethod === 'online'}
                  onChange={handleInputChange}
                />
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Order Notes (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="notes"
                  value={orderForm.notes}
                  onChange={handleInputChange}
                  placeholder="Any special instructions for your order"
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          {orderSuccess ? (
            <Button variant="primary" onClick={handleCloseModal}>
              Continue Shopping
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setShowCheckout(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleCheckout} 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  <>Place Order ({formatCurrency(totalAmount)})</>
                )}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ShoppingCart;
