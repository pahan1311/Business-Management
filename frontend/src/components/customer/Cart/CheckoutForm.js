import React, { useState } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useAuth } from '../../../hooks/useAuth';

const CheckoutForm = ({ onSubmit, totalAmount, formattedTotal }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zip || '',
    paymentMethod: 'cash',
    notes: ''
  });
  
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    setValidated(true);
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      return;
    }
    
    try {
      // Format the data for API submission
      const orderData = {
        customer: user.id,
        deliveryAddress: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zipCode
        },
        contactInfo: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone
        },
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        totalAmount
      };
      
      onSubmit(orderData);
    } catch (error) {
      setError('There was a problem submitting your order. Please try again.');
      console.error(error);
    }
  };

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <h5 className="mb-3">Contact Information</h5>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="firstName">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              required
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
            />
            <Form.Control.Feedback type="invalid">
              Please provide your first name.
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group controlId="lastName">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              required
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
            />
            <Form.Control.Feedback type="invalid">
              Please provide your last name.
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            <Form.Control.Feedback type="invalid">
              Please provide a valid email address.
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group controlId="phone">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              required
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              pattern="[0-9]{10}"
            />
            <Form.Control.Feedback type="invalid">
              Please provide a valid 10-digit phone number.
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      
      <h5 className="mb-3 mt-4">Shipping Address</h5>
      <Form.Group className="mb-3" controlId="address">
        <Form.Label>Street Address</Form.Label>
        <Form.Control
          required
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
        />
        <Form.Control.Feedback type="invalid">
          Please provide your street address.
        </Form.Control.Feedback>
      </Form.Group>
      
      <Row className="mb-3">
        <Col md={5}>
          <Form.Group controlId="city">
            <Form.Label>City</Form.Label>
            <Form.Control
              required
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
            />
            <Form.Control.Feedback type="invalid">
              Please provide your city.
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        
        <Col md={4}>
          <Form.Group controlId="state">
            <Form.Label>State</Form.Label>
            <Form.Control
              required
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
            />
            <Form.Control.Feedback type="invalid">
              Please provide your state.
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        
        <Col md={3}>
          <Form.Group controlId="zipCode">
            <Form.Label>ZIP Code</Form.Label>
            <Form.Control
              required
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              pattern="[0-9]{5}"
            />
            <Form.Control.Feedback type="invalid">
              Please provide a valid 5-digit ZIP code.
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      
      <h5 className="mb-3 mt-4">Payment Method</h5>
      <Form.Group className="mb-3">
        <Form.Check
          type="radio"
          id="cash"
          label="Cash on Delivery"
          name="paymentMethod"
          value="cash"
          checked={formData.paymentMethod === 'cash'}
          onChange={handleChange}
          required
        />
        <Form.Check
          type="radio"
          id="creditCard"
          label="Credit Card"
          name="paymentMethod"
          value="credit_card"
          checked={formData.paymentMethod === 'credit_card'}
          onChange={handleChange}
          required
        />
        <Form.Check
          type="radio"
          id="paypal"
          label="PayPal"
          name="paymentMethod"
          value="paypal"
          checked={formData.paymentMethod === 'paypal'}
          onChange={handleChange}
          required
        />
      </Form.Group>
      
      <Form.Group className="mb-3" controlId="notes">
        <Form.Label>Order Notes (Optional)</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Special instructions for delivery"
        />
      </Form.Group>
      
      <div className="d-flex justify-content-between align-items-center mt-4">
        <div>
          <p className="mb-0">Order Total:</p>
          <h4>{formattedTotal}</h4>
        </div>
        <Button variant="primary" type="submit" size="lg">
          Place Order
        </Button>
      </div>
    </Form>
  );
};

export default CheckoutForm;
