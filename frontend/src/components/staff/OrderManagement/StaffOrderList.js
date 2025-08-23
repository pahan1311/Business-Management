import React, { useState, useEffect } from 'react';
import { orderAPI, deliveryAPI, userAPI } from '../../../services/api';
import StatusBadge from '../../common/StatusBadge';
import LoadingSpinner from '../../common/LoadingSpinner';
import { formatDate, formatCurrency } from '../../../utils/helpers';
import { ORDER_STATUS } from '../../../utils/constants';
import { Modal, Form, Button } from 'react-bootstrap';

const StaffOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState('');
  const [currentOrderForDelivery, setCurrentOrderForDelivery] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [assigningDelivery, setAssigningDelivery] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchDeliveryPersonnel();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getAll();
      
      let ordersData = [];
      if (response.data && Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data && response.data.orders) {
        ordersData = response.data.orders;
      } else if (response.data && typeof response.data === 'object') {
        ordersData = [response.data];
      }
      
      setOrders(ordersData);
      console.log('Fetched orders:', ordersData);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDeliveryPersonnel = async () => {
    try {
      const response = await userAPI.getByRole('delivery');
      
      let personnelData = [];
      if (Array.isArray(response.data)) {
        personnelData = response.data;
      } else if (response.data && response.data.users) {
        personnelData = response.data.users;
      }
      
      setDeliveryPersonnel(personnelData);
      console.log('Fetched delivery personnel:', personnelData);
    } catch (error) {
      console.error('Failed to fetch delivery personnel:', error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleAssignDelivery = async () => {
    if (!currentOrderForDelivery || !selectedDeliveryPerson) {
      console.error('Missing order or delivery person for assignment');
      alert('Please select a delivery person');
      return;
    }
    
    setAssigningDelivery(true);
    
    try {
      console.log('Current order for delivery:', currentOrderForDelivery);
      console.log('Selected delivery person ID:', selectedDeliveryPerson);
      
      // Get the selected delivery person details
      const selectedPerson = deliveryPersonnel.find(p => {
        const personId = p._id?.toString() || p.id?.toString();
        const selectedId = selectedDeliveryPerson?.toString();
        return personId === selectedId;
      });
      
      console.log('Found delivery person:', selectedPerson);
      
      if (!selectedPerson) {
        console.error('Delivery person not found in personnel list');
      }
      
      // Create a delivery record
      const orderId = currentOrderForDelivery._id || currentOrderForDelivery.id;
      if (!orderId) {
        console.error('Order ID is missing');
        alert('Cannot assign delivery: Order ID is missing');
        return;
      }
      
      const deliveryData = {
        order: orderId,
        deliveryPerson: selectedDeliveryPerson,
        status: 'assigned',
        address: currentOrderForDelivery.shippingAddress || currentOrderForDelivery.address || {},
        customerName: currentOrderForDelivery.customerName || currentOrderForDelivery.customer?.name || 'Customer',
        contactPhone: currentOrderForDelivery.phone || currentOrderForDelivery.customer?.phone || '',
        items: currentOrderForDelivery.items || []
      };
      
      console.log('Preparing to create delivery with data:', deliveryData);
      
      // Create the delivery
      const deliveryResponse = await deliveryAPI.create(deliveryData);
      console.log('Delivery created:', deliveryResponse);
      
      // Store the delivery ID for later use
      const deliveryId = deliveryResponse.data._id;
      
      // Update the order with the delivery person info and delivery ID
      try {
        const orderId = currentOrderForDelivery._id || currentOrderForDelivery.id;
        console.log('Updating order with ID:', orderId);
        
        const updatedOrder = {
          ...currentOrderForDelivery,
          assignedStaff: selectedDeliveryPerson,
          deliveryPerson: selectedPerson ? selectedPerson._id || selectedPerson.id : selectedDeliveryPerson,
          deliveryPersonId: selectedDeliveryPerson,
          deliveryId: deliveryId,
          deliveryStatus: 'assigned',
          status: 'out_for_delivery' // Update status directly in the order object
        };
        
        console.log('Updating order with data:', updatedOrder);
        
        // Update the full order
        await orderAPI.update(orderId, updatedOrder);
        console.log('Order updated successfully');
        
        // Also call the separate status update endpoint
        await orderAPI.updateStatus(orderId, 'out_for_delivery');
        console.log('Order status updated successfully');
        
        // Close the delivery assignment modal
        setShowDeliveryModal(false);
        setSelectedDeliveryPerson('');
        setCurrentOrderForDelivery(null);
        
        // Show success message
        const orderIdDisplay = currentOrderForDelivery.orderNumber || 
                              (currentOrderForDelivery._id ? currentOrderForDelivery._id.toString().substring(0, 6) : '');
        alert(`Delivery person successfully assigned to order #${orderIdDisplay}`);
        
      } catch (error) {
        console.error('Failed to update order:', error);
        alert('Failed to update order status. See console for details.');
      }
      
      // Refresh orders
      fetchOrders();
    } catch (error) {
      console.error('Failed to assign delivery:', error);
      alert('Failed to assign delivery. Please try again.');
    } finally {
      setAssigningDelivery(false);
    }
  };
  
  const openDeliveryModal = (order) => {
    setCurrentOrderForDelivery(order);
    setShowDeliveryModal(true);
    // Refresh delivery personnel list when opening modal
    fetchDeliveryPersonnel();
  };
  
  const openOrderDetailsModal = (order) => {
    setSelectedOrder(order);
    setShowOrderDetailsModal(true);
  };

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    if (!order) return false;
    
    const orderId = order.id || order._id || '';
    const customerName = order.customerName || order.customer?.name || '';
    const status = order.status || '';
    
    const matchesSearch = 
      !searchTerm || 
      orderId.toString().includes(searchTerm) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner text="Loading orders..." />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Order Management</h2>
        <button 
          className="btn btn-outline-primary"
          onClick={fetchOrders}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh Orders
        </button>
      </div>

      {/* Search and Filter */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by order ID or customer name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {Object.entries(ORDER_STATUS).map(([key, value]) => (
              <option key={key} value={key.toLowerCase()}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="alert alert-info">
          No orders found matching your criteria
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
                <th>Date</th>
                <th>Delivery Person</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id || order._id}>
                  <td>#{order.orderNumber || order.id || (order._id ? order._id.toString().substring(0, 6) : '')}</td>
                  <td>{order.customerName || order.customer?.name || 'N/A'}</td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td>{formatCurrency(order.total || order.totalAmount || 0)}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    {(() => {
                      // First check assignedStaff (most reliable field)
                      if (order.assignedStaff) {
                        const deliveryPerson = deliveryPersonnel.find(
                          p => p._id === order.assignedStaff || p.id === order.assignedStaff ||
                               p._id?.toString() === order.assignedStaff?.toString() || 
                               p.id?.toString() === order.assignedStaff?.toString()
                        );
                        return deliveryPerson ? deliveryPerson.name : 'Assigned';
                      } 
                      // Then check deliveryPerson field
                      else if (order.deliveryPerson) {
                        if (typeof order.deliveryPerson === 'string') {
                          const deliveryPerson = deliveryPersonnel.find(
                            p => p._id === order.deliveryPerson || p.id === order.deliveryPerson ||
                                 p._id?.toString() === order.deliveryPerson?.toString() || 
                                 p.id?.toString() === order.deliveryPerson?.toString()
                          );
                          return deliveryPerson ? deliveryPerson.name : 'Assigned';
                        } else {
                          return order.deliveryPerson.name || 'Assigned';
                        }
                      }
                      // Finally check if there's a delivery ID assigned
                      else if (order.deliveryId) {
                        return 'Assigned';
                      }
                      // If no delivery person found
                      return 'Not assigned';
                    })()}
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => openOrderDetailsModal(order)}
                      >
                        <i className="bi bi-eye me-1"></i> View
                      </button>

                      <button
                        className="btn btn-outline-info"
                        onClick={() => openDeliveryModal(order)}
                        disabled={order.status === 'delivered' || order.status === 'cancelled'}
                      >
                        <i className="bi bi-truck me-1"></i> Assign Delivery
                      </button>
                      
                      {order.status === 'confirmed' && (
                        <button
                          className="btn btn-outline-success"
                          onClick={() => updateOrderStatus(order.id || order._id, 'processing')}
                        >
                          <i className="bi bi-play me-1"></i> Process
                        </button>
                      )}
                      
                      {order.status === 'processing' && (
                        <button
                          className="btn btn-outline-info"
                          onClick={() => updateOrderStatus(order.id || order._id, 'ready')}
                        >
                          <i className="bi bi-check-circle me-1"></i> Mark Ready
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Delivery Modal */}
      <Modal show={showDeliveryModal} onHide={() => setShowDeliveryModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Delivery Personnel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deliveryPersonnel.length === 0 ? (
            <div className="alert alert-warning">
              No delivery personnel available. Please add delivery staff first.
            </div>
          ) : (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Order ID</Form.Label>
                <Form.Control 
                  type="text" 
                  value={`#${currentOrderForDelivery?.orderNumber || 
                         currentOrderForDelivery?.id || 
                         (currentOrderForDelivery?._id ? 
                            (typeof currentOrderForDelivery._id === 'string' ? 
                              currentOrderForDelivery._id.substring(0, 6) : 
                              currentOrderForDelivery._id.toString().substring(0, 6)) : 
                            '')}`}
                  disabled
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Customer</Form.Label>
                <Form.Control 
                  type="text" 
                  value={currentOrderForDelivery?.customerName || 
                        (currentOrderForDelivery?.customer?.name) || 'N/A'}
                  disabled
                />
              </Form.Group>
              
              {(currentOrderForDelivery?.shippingAddress || currentOrderForDelivery?.address) && (
                <Form.Group className="mb-3">
                  <Form.Label>Delivery Address</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2}
                    value={
                      (currentOrderForDelivery?.shippingAddress?.street ? 
                        `${currentOrderForDelivery?.shippingAddress?.street}, 
                        ${currentOrderForDelivery?.shippingAddress?.city}, 
                        ${currentOrderForDelivery?.shippingAddress?.state} 
                        ${currentOrderForDelivery?.shippingAddress?.zip}` : 
                        '') ||
                      (currentOrderForDelivery?.address?.street ? 
                        `${currentOrderForDelivery?.address?.street}, 
                        ${currentOrderForDelivery?.address?.city}, 
                        ${currentOrderForDelivery?.address?.state} 
                        ${currentOrderForDelivery?.address?.zip}` : 
                        '') ||
                      (typeof currentOrderForDelivery?.address === 'string' ? 
                        currentOrderForDelivery?.address : '')
                    }
                    disabled
                  />
                </Form.Group>
              )}
              
              <Form.Group className="mb-3">
                <Form.Label>Select Delivery Person</Form.Label>
                <Form.Select
                  value={selectedDeliveryPerson}
                  onChange={(e) => setSelectedDeliveryPerson(e.target.value)}
                >
                  <option value="">Select a delivery person</option>
                  {deliveryPersonnel.map((person) => (
                    <option key={person.id || person._id} value={person.id || person._id}>
                      {person.name || person.email}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeliveryModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAssignDelivery}
            disabled={!selectedDeliveryPerson || deliveryPersonnel.length === 0 || assigningDelivery}
          >
            {assigningDelivery ? 'Assigning...' : 'Assign Delivery'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Order Details Modal */}
      <Modal 
        show={showOrderDetailsModal} 
        onHide={() => setShowOrderDetailsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Order Details #{selectedOrder?.id || (selectedOrder?._id ? selectedOrder._id.toString().substring(0, 6) : '')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <h6>Customer Information</h6>
                  <p className="mb-1">
                    <strong>Name:</strong> {selectedOrder.customerName || selectedOrder.customer?.name}
                  </p>
                  <p className="mb-1">
                    <strong>Email:</strong> {selectedOrder.customerEmail || selectedOrder.customer?.email}
                  </p>
                  <p className="mb-0">
                    <strong>Phone:</strong> {selectedOrder.customerPhone || selectedOrder.customer?.phone || 'N/A'}
                  </p>
                </div>
                <div className="col-md-6">
                  <h6>Order Information</h6>
                  <p className="mb-1">
                    <strong>Date:</strong> {formatDate(selectedOrder.createdAt)}
                  </p>
                  <p className="mb-1">
                    <strong>Status:</strong> <StatusBadge status={selectedOrder.status} />
                  </p>
                  <p className="mb-0">
                    <strong>Total:</strong> {formatCurrency(selectedOrder.total || selectedOrder.totalAmount)}
                  </p>
                </div>
              </div>

              <h6>Shipping Address</h6>
              <p className="mb-3">
                {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zip}
              </p>

              <h6>Order Items</h6>
              <div className="table-responsive">
                <table className="table table-sm table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.price)}</td>
                        <td>{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                      <td><strong>{formatCurrency(selectedOrder.total || selectedOrder.totalAmount)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOrderDetailsModal(false)}>
            Close
          </Button>
          {selectedOrder?.status === 'ready' && (
            <Button 
              variant="primary" 
              onClick={() => {
                setShowOrderDetailsModal(false);
                openDeliveryModal(selectedOrder);
              }}
            >
              Assign Delivery
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StaffOrderList;
