import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, ListGroup, Row, Col } from 'react-bootstrap';
import { orderAPI, staffAPI } from '../../../services/api';
import StatusBadge from '../../common/StatusBadge';
import LoadingSpinner from '../../common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../../utils/helpers';
import { ORDER_STATUS } from '../../../utils/constants';

const OrderDetail = ({ order, show, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (order) {
      setStatus(order.status || '');
      setSelectedStaff(order.assignedStaff?._id || '');
    }
  }, [order]);

  useEffect(() => {
    if (show) {
      fetchAvailableStaff();
    }
  }, [show]);

  const fetchAvailableStaff = async () => {
    try {
      setLoading(true);
      const response = await staffAPI.getAvailable();
      setStaff(response.data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setError('Failed to load available staff.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!status || status === order.status) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await orderAPI.updateStatus(order._id, status);
      setSuccess('Order status updated successfully');
      
      if (onUpdate) {
        onUpdate({ ...order, status });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaff || selectedStaff === order.assignedStaff?._id) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await orderAPI.assignStaff(order._id, selectedStaff);
      
      // Find the staff details from our local state
      const assignedStaff = staff.find(s => s._id === selectedStaff);
      
      setSuccess(`Order assigned to ${assignedStaff?.name || 'staff member'} successfully`);
      
      if (onUpdate) {
        onUpdate({
          ...order,
          assignedStaff: assignedStaff || { _id: selectedStaff },
          status: order.status === 'pending' ? 'confirmed' : order.status
        });
      }
    } catch (error) {
      console.error('Error assigning staff:', error);
      setError('Failed to assign staff to order');
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <Modal show={show} onHide={onClose} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          Order #{order._id?.slice(-6)}
          <StatusBadge status={order.status} className="ms-2" />
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {loading && <LoadingSpinner overlay />}
        
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        <Row className="mb-4">
          <Col md={6}>
            <h5>Customer Information</h5>
            <p className="mb-1">
              <strong>Name:</strong> {order.customer?.name}
            </p>
            <p className="mb-1">
              <strong>Email:</strong> {order.customer?.email}
            </p>
            <p className="mb-1">
              <strong>Phone:</strong> {order.customer?.phone || 'N/A'}
            </p>
          </Col>
          
          <Col md={6}>
            <h5>Order Details</h5>
            <p className="mb-1">
              <strong>Order Date:</strong> {formatDate(order.createdAt)}
            </p>
            <p className="mb-1">
              <strong>Payment Method:</strong> {order.paymentMethod?.replace('_', ' ')}
            </p>
            <p className="mb-1">
              <strong>Payment Status:</strong> {order.paymentStatus}
            </p>
          </Col>
        </Row>

        <h5>Items</h5>
        <ListGroup className="mb-4">
          {order.items?.map((item, index) => (
            <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-bold">{item.name}</span>
                <br />
                <small className="text-muted">
                  {formatCurrency(item.price)} x {item.quantity}
                </small>
              </div>
              <span className="fw-bold">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </ListGroup.Item>
          ))}
          <ListGroup.Item className="d-flex justify-content-between align-items-center bg-light">
            <span className="fw-bold">Total</span>
            <span className="fw-bold">{formatCurrency(order.totalAmount)}</span>
          </ListGroup.Item>
        </ListGroup>

        {order.deliveryAddress && (
          <div className="mb-4">
            <h5>Delivery Address</h5>
            <p className="mb-1">
              {order.deliveryAddress.street}<br />
              {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zip}<br />
              {order.deliveryAddress.country}
            </p>
          </div>
        )}

        {order.notes && (
          <div className="mb-4">
            <h5>Notes</h5>
            <p className="mb-0">{order.notes}</p>
          </div>
        )}

        <Row className="mb-3">
          <Col md={6}>
            <h5>Update Status</h5>
            <Form.Group controlId="orderStatus">
              <Form.Select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Select Status</option>
                {Object.entries(ORDER_STATUS).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </Form.Select>
              <div className="d-grid mt-2">
                <Button 
                  variant="outline-primary" 
                  onClick={handleStatusChange}
                  disabled={!status || status === order.status}
                >
                  Update Status
                </Button>
              </div>
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <h5>Assign Staff</h5>
            <Form.Group controlId="assignStaff">
              <Form.Select 
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
              >
                <option value="">Select Staff</option>
                {staff.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </Form.Select>
              <div className="d-grid mt-2">
                <Button 
                  variant="outline-primary"
                  onClick={handleAssignStaff}
                  disabled={!selectedStaff || selectedStaff === order.assignedStaff?._id}
                >
                  Assign Staff
                </Button>
              </div>
            </Form.Group>
          </Col>
        </Row>

        {order.assignedStaff && (
          <div className="alert alert-info">
            <strong>Currently Assigned:</strong> {order.assignedStaff.name || 'Staff ID: ' + order.assignedStaff._id}
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OrderDetail;
