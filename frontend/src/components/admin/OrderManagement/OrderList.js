import React, { useState, useEffect } from 'react';
import { orderAPI, customerAPI, userAPI, deliveryAPI } from '../../../services/api';
import { useCrud } from '../../../hooks/useApi';
import Button from '../../common/Button';
import StatusBadge from '../../common/StatusBadge';
import LoadingSpinner from '../../common/LoadingSpinner';
import { formatDate, formatCurrency, getStatusBadgeColor } from '../../../utils/helpers';
import { ORDER_STATUS } from '../../../utils/constants';
import OrderDetail from './OrderDetail';
import { Modal, Form, Image } from 'react-bootstrap';
import QRCodeService from '../../../services/qrCodeService';

const OrderList = () => {
  const {
    items: orders,
    loading,
    fetchAll,
    update
  } = useCrud(orderAPI);

  // Debug log to check orders
  console.log('Current orders:', orders);

  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState('');
  const [currentOrderForDelivery, setCurrentOrderForDelivery] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQRCodeData] = useState('');
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDeliveryForQR, setSelectedDeliveryForQR] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'deliveries'
  
  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchDeliveryPersonnel();
    fetchDeliveries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Custom function to directly fetch orders
  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getAll();
      console.log('Direct API response for orders:', response);
      
      // Handle the orders response structure
      if (response.data && response.data.orders) {
        console.log('Setting orders from direct API call:', response.data.orders);
        // Update the orders state
        // We're using the useCrud hook's items state, but calling this directly
        fetchAll();
      }
    } catch (error) {
      console.error('Error fetching orders directly:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getAll();
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };
  
  const fetchDeliveryPersonnel = async () => {
    try {
      const response = await userAPI.getByRole('delivery');
      if (Array.isArray(response.data)) {
        setDeliveryPersonnel(response.data);
      } else if (response.data && response.data.users) {
        setDeliveryPersonnel(response.data.users);
      } else {
        setDeliveryPersonnel([]);
      }
    } catch (error) {
      console.error('Failed to fetch delivery personnel:', error);
    }
  };
  
  const fetchDeliveries = async () => {
    try {
      const response = await deliveryAPI.getAll();
      if (Array.isArray(response.data)) {
        setDeliveries(response.data);
      } else if (response.data && response.data.deliveries) {
        setDeliveries(response.data.deliveries);
      } else {
        setDeliveries([]);
      }
      console.log('Fetched deliveries:', response.data);
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    }
  };
  
  const createTestOrder = async () => {
    try {
      // Current timestamp for unique order number
      const timestamp = Date.now();
      
      const sampleOrder = {
        orderNumber: `TEST-${timestamp.toString().slice(-6)}`,
        customerName: "Test Customer",
        items: [
          { 
            name: "Test Product", 
            quantity: 1, 
            price: 19.99,
            productId: `prod-${timestamp}`
          }
        ],
        totalAmount: 19.99,
        total: 19.99,
        status: "pending",
        createdAt: new Date().toISOString(),
        shippingAddress: {
          street: "123 Test St",
          city: "Test City",
          state: "TS",
          zip: "12345"
        }
      };
      
      console.log("Creating test order:", sampleOrder);
      const result = await orderAPI.create(sampleOrder);
      console.log("Created test order:", result);
      
      // Refresh orders to show the new one
      fetchOrders();
    } catch (error) {
      console.error("Error creating sample order:", error);
    }
  };

  // Make sure orders is always an array and handle possible empty/null items
  let safeOrders = [];
  if (Array.isArray(orders)) {
    safeOrders = orders;
  } else if (orders && typeof orders === 'object') {
    // If it's an object but not an array, it might be a single order
    safeOrders = [orders];
  }
  
  // Add some dummy orders for testing if no orders exist
  if (safeOrders.length === 0) {
    console.log('No orders found, adding dummy orders for UI testing');
    safeOrders = [
      {
        _id: 'dummy1',
        customerName: 'John Doe',
        items: [{ name: 'Product 1', quantity: 2, price: 29.99 }],
        total: 59.98,
        totalAmount: 59.98,
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'dummy2',
        customerName: 'Jane Smith',
        items: [{ name: 'Product 2', quantity: 1, price: 49.99 }],
        total: 49.99,
        totalAmount: 49.99,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      }
    ];
  }
  
  console.log('Orders before filtering:', safeOrders);

  const filteredOrders = safeOrders.filter(order => {
    if (!order) return false;
    
    // Debug log for individual orders
    console.log('Filtering order:', order);
    
    // Extract order properties safely
    const orderId = order.orderNumber || order.id || order._id;
    const customerName = order.customerName || order.customer?.name || '';
    const status = order.status || 'unknown';
    
    // If search term is empty, include all orders
    const matchesSearch = 
      !searchTerm || 
      (orderId && orderId.toString().includes(searchTerm)) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // If status filter is empty, include all statuses
    const matchesStatus = !statusFilter || status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Debug log for filtered orders
  console.log('Filtered orders:', filteredOrders);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };
  
  const handleOrderUpdate = (updatedOrder) => {
    update(updatedOrder._id, updatedOrder);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setModalLoading(true);
    try {
      console.log('Updating order status:', orderId, newStatus);
      await orderAPI.updateStatus(orderId, newStatus);
      
      // Refresh orders
      await fetchOrders();
      
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder._id === orderId)) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus
        });
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setModalLoading(false);
    }
  };
  
  const handleShowAssignDelivery = (order) => {
    setCurrentOrderForDelivery(order);
    setSelectedDeliveryPerson('');
    setShowDeliveryModal(true);
  };
  
  const handleAssignDelivery = async () => {
    if (!selectedDeliveryPerson || !currentOrderForDelivery) return;
    
    setModalLoading(true);
    try {
      // Get the selected delivery person details
      const selectedPerson = deliveryPersonnel.find(p => p._id === selectedDeliveryPerson);
      
      // Create a delivery record
      const deliveryData = {
        order: currentOrderForDelivery._id || currentOrderForDelivery.id,
        deliveryPerson: selectedDeliveryPerson,
        status: 'assigned',
        address: currentOrderForDelivery.shippingAddress || currentOrderForDelivery.address,
        customerName: currentOrderForDelivery.customerName || currentOrderForDelivery.customer?.name,
        contactPhone: currentOrderForDelivery.phone || currentOrderForDelivery.customer?.phone,
        items: currentOrderForDelivery.items
      };
      
      // Create the delivery
      const deliveryResponse = await deliveryAPI.create(deliveryData);
      console.log('Delivery created:', deliveryResponse);
      
      // Store the delivery ID for later use in the confirm step
      const deliveryId = deliveryResponse.data._id;
      
      // Update the order with the delivery person info and delivery ID
      const updatedOrder = {
        ...currentOrderForDelivery,
        assignedStaff: selectedDeliveryPerson, // Update proper field in the schema
        deliveryPerson: selectedPerson, // Keep this for frontend reference
        deliveryPersonId: selectedDeliveryPerson, // Keep this for frontend reference
        deliveryId: deliveryId, // Store the delivery ID in the order for reference
        deliveryStatus: 'assigned' // Track delivery status specifically
      };
      
      await orderAPI.update(
        currentOrderForDelivery._id || currentOrderForDelivery.id,
        updatedOrder
      );
      
      // Update the order status to reflect it's assigned for delivery
      await orderAPI.updateStatus(
        currentOrderForDelivery._id || currentOrderForDelivery.id, 
        'out_for_delivery'
      );
      
      // Close the delivery assignment modal
      setShowDeliveryModal(false);
      
      // Show success message or notification
      alert(`Delivery person successfully assigned to order ${currentOrderForDelivery.orderNumber || currentOrderForDelivery._id?.toString().slice(-6)}`);
      // Alternatively you could use a toast notification system here
      
      // Refresh orders
      await fetchAll();
    } catch (error) {
      console.error('Failed to assign delivery person:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelivery = async (delivery) => {
    setModalLoading(true);
    try {
      // Update delivery status to "delivering" if we have a delivery ID
      if (delivery._id) {
        try {
          await deliveryAPI.updateStatus(delivery._id, 'in_transit');
          console.log(`Successfully updated delivery ${delivery._id} to in_transit status`);
        } catch (error) {
          console.error('Failed to update delivery status:', error);
          // Continue with order updates even if delivery update fails
        }
      }
      
      // Update order status to reflect active delivery
      await orderAPI.updateStatus(delivery.order, 'out_for_delivery');
      
      // Get the current order details
      const currentOrder = orders.find(order => order._id === delivery.order || order.id === delivery.order);
      if (currentOrder) {
        // Update the order with the latest delivery status
        await orderAPI.update(delivery.order, {
          ...currentOrder,
          deliveryStatus: 'in_transit' // Update the delivery status in order record
        });
        
        console.log(`Successfully updated order ${delivery.order} with in_transit delivery status`);
      } else {
        console.warn(`Could not find order ${delivery.order} to update delivery status`);
      }
      
      setDeliveryConfirmed(true);
      
      // Refresh data
      await fetchAll();
      await fetchOrders();
      
    } catch (error) {
      console.error('Failed to confirm delivery:', error);
    } finally {
      setModalLoading(false);
    }
  };
  
  const downloadQRCode = () => {
    // Create a download link for the QR code
    const link = document.createElement('a');
    link.href = qrCodeData;
    link.download = 'delivery-qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleGenerateQRForDelivery = async (delivery) => {
    setModalLoading(true);
    try {
      console.log("Generating QR code for delivery:", delivery);
      setSelectedDeliveryForQR(delivery);
      
      // Make sure we have an order ID
      if (!delivery.order) {
        throw new Error("Delivery has no associated order ID");
      }
      
      // Fetch the related order to get all necessary details
      console.log("Fetching order with ID:", delivery.order);
      const orderResponse = await orderAPI.getById(delivery.order);
      const orderData = orderResponse.data;
      console.log("Retrieved order data:", orderData);
      
      // Fetch the delivery person details if needed
      let deliveryPersonData = null;
      if (delivery.deliveryPerson) {
        try {
          console.log("Fetching delivery person with ID:", delivery.deliveryPerson);
          const personResponse = await userAPI.getById(delivery.deliveryPerson);
          deliveryPersonData = personResponse.data;
          console.log("Retrieved delivery person data:", deliveryPersonData);
        } catch (err) {
          console.error('Failed to fetch delivery person details:', err);
        }
      }
      
      // Generate QR code data for the delivery
      const qrDataObj = {
        orderId: orderData._id || orderData.id,
        orderNumber: orderData.orderNumber || orderData._id?.toString().slice(-6),
        deliveryId: delivery._id,
        deliveryPerson: deliveryPersonData ? {
          id: deliveryPersonData._id,
          name: deliveryPersonData.name,
          phone: deliveryPersonData.phone
        } : {
          id: delivery.deliveryPerson,
          name: "Unknown"
        },
        customer: {
          name: delivery.customerName || orderData.customerName || orderData.customer?.name,
          address: delivery.address || orderData.shippingAddress || orderData.address
        },
        items: delivery.items || orderData.items,
        timestamp: new Date().toISOString()
      };
      
      console.log("QR data object:", qrDataObj);
      const qrData = JSON.stringify(qrDataObj);
      
      // Generate QR code image
      console.log("Generating QR code with data:", qrData);
      try {
        const qrCodeImage = await QRCodeService.generateQRCode(qrData);
        console.log("QR code image generated successfully");
        setQRCodeData(qrCodeImage);
        
        // Show QR code modal
        setDeliveryConfirmed(delivery.status === 'in_transit');
        setShowQRModal(true);
      } catch (qrError) {
        console.error("Failed to generate QR code:", qrError);
        alert("Failed to generate QR code. See console for details.");
      }
    } catch (error) {
      console.error('Failed to generate QR code for delivery:', error);
      alert(`Error generating QR code: ${error.message || 'Unknown error'}`);
    } finally {
      setModalLoading(false);
    }
  };

  const getStatusOptions = (currentStatus) => {
    const statusFlow = {
      [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.READY]: [ORDER_STATUS.OUT_FOR_DELIVERY],
      [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED],
      [ORDER_STATUS.DELIVERED]: [],
      [ORDER_STATUS.CANCELLED]: []
    };

    return statusFlow[currentStatus] || [];
  };

  if (loading) {
    return <LoadingSpinner text="Loading orders..." />;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Order Management</h2>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary" 
            onClick={() => {
              fetchAll();
              fetchDeliveries();
            }}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </Button>
          <Button 
            variant="outline-success" 
            onClick={createTestOrder}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Add Test Order
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <i className="bi bi-cart-check me-2"></i>
            Orders
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'deliveries' ? 'active' : ''}`}
            onClick={() => setActiveTab('deliveries')}
          >
            <i className="bi bi-truck me-2"></i>
            Deliveries
          </button>
        </li>
      </ul>

      {/* Search and Filters */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-4">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            {Object.values(ORDER_STATUS).map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2 text-end">
          <span className="text-muted">
            {filteredOrders.length} orders
          </span>
        </div>
      </div>

      {/* Order Stats */}
      <div className="row g-3 mb-4">
        {Object.values(ORDER_STATUS).map(status => {
          const count = orders.filter(order => order.status === status).length;
          return (
            <div key={status} className="col-md-2">
              <div className="card text-center">
                <div className="card-body py-2">
                  <div className={`badge bg-${getStatusBadgeColor(status)} w-100 mb-1`}>
                    {status.replace('_', ' ').toUpperCase()}
                  </div>
                  <h4 className="mb-0">{count}</h4>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conditional Tab Content */}
      {activeTab === 'orders' ? (
        /* Order Table */
        <div className="card">
          <div className="card-body">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-4">
                <i className="bi bi-cart-x fs-1 text-muted d-block mb-2"></i>
                <p className="text-muted">No orders found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                    <th>Delivery Person</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order._id || order.id || `order-${Math.random()}`}>
                      <td>
                        <strong>#{order.orderNumber || order.id || (order._id?.toString().slice(-6)) || 'N/A'}</strong>
                      </td>
                      <td>{order.customerName || order.customer?.name || 'Unknown Customer'}</td>
                      <td>
                        <small>
                          {order.items?.length || 0} items
                        </small>
                      </td>
                      <td>
                        <strong>{formatCurrency(order.total || order.totalAmount || 0)}</strong>
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        {order.assignedStaff ? 
                          (() => {
                            // Find the delivery person's name from the assignedStaff ID
                            const deliveryPerson = deliveryPersonnel.find(p => p._id === order.assignedStaff);
                            return deliveryPerson ? deliveryPerson.name : `ID: ${order.assignedStaff}`;
                          })()
                          : (order.deliveryPerson ? order.deliveryPerson.name : 'Not assigned')}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleViewOrder(order)}
                          >
                            View
                          </button>
                          
                          <button
                            className="btn btn-outline-info"
                            onClick={() => handleShowAssignDelivery(order)}
                            disabled={order.status === 'delivered' || order.status === 'cancelled'}
                          >
                            Assign Delivery
                          </button>
                          
                          {getStatusOptions(order.status).length > 0 && (
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-secondary dropdown-toggle"
                                data-bs-toggle="dropdown"
                              >
                                Update Status
                              </button>
                              <ul className="dropdown-menu">
                                {getStatusOptions(order.status).map(status => (
                                  <li key={status}>
                                    <button
                                      className="dropdown-item"
                                      onClick={() => handleUpdateStatus(order._id || order.id, status)}
                                    >
                                      {status.replace('_', ' ').toUpperCase()}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      ) : (
        /* Deliveries Table */
        <div className="card">
          <div className="card-body">
            {deliveries.length === 0 ? (
              <div className="text-center py-4">
                <i className="bi bi-truck fs-1 text-muted d-block mb-2"></i>
                <p className="text-muted">No deliveries found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Delivery ID</th>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Delivery Person</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((delivery) => (
                      <tr key={delivery._id}>
                        <td>{delivery._id.toString().slice(-6)}</td>
                        <td>
                          {delivery.orderId || 
                           (delivery.order && (
                             typeof delivery.order === 'string' ? 
                               delivery.order.slice(-6) : 
                               delivery.order._id ? 
                                 delivery.order._id.toString().slice(-6) : 
                                 'N/A'
                           ))
                          }
                        </td>
                        <td>{delivery.customerName || 'N/A'}</td>
                        <td>
                          {delivery.deliveryPerson ? (
                            typeof delivery.deliveryPerson === 'string' ? 
                              delivery.deliveryPerson.slice(-6) : 
                              delivery.deliveryPerson.name || 'Assigned'
                          ) : 'Not Assigned'}
                        </td>
                        <td>
                          <StatusBadge 
                            status={delivery.status} 
                            colorMap={{
                              pending: 'secondary',
                              assigned: 'info',
                              picked_up: 'primary',
                              in_transit: 'warning',
                              delivered: 'success',
                              rejected: 'danger',
                              failed: 'danger',
                              cancelled: 'dark'
                            }}
                          />
                        </td>
                        <td>{formatDate(delivery.createdAt)}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button 
                              size="sm"
                              variant="outline-info"
                              title="Generate QR Code"
                              onClick={() => handleGenerateQRForDelivery(delivery)}
                            >
                              <i className="bi bi-qr-code"></i>
                            </Button>
                            
                            <Button 
                              size="sm"
                              variant="outline-primary"
                              title="View Details"
                              onClick={() => {
                                // Find and show related order
                                const relatedOrder = orders.find(order => 
                                  order._id === delivery.order || 
                                  order.id === delivery.order
                                );
                                if (relatedOrder) {
                                  setSelectedOrder(relatedOrder);
                                  setShowModal(true);
                                }
                              }}
                            >
                              <i className="bi bi-eye"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetail
        order={selectedOrder}
        show={showModal}
        onClose={() => setShowModal(false)}
        onUpdate={handleOrderUpdate}
      />
      
      {/* Assign Delivery Person Modal */}
      <Modal show={showDeliveryModal} onHide={() => setShowDeliveryModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Delivery Person</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentOrderForDelivery && (
            <div>
              <div className="alert alert-info mb-3">
                <div><strong>Order ID:</strong> #{currentOrderForDelivery.id || currentOrderForDelivery._id}</div>
                <div><strong>Customer:</strong> {currentOrderForDelivery.customerName || currentOrderForDelivery.customer?.name}</div>
                <div><strong>Status:</strong> <StatusBadge status={currentOrderForDelivery.status} /></div>
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Select Delivery Person</Form.Label>
                <Form.Select
                  value={selectedDeliveryPerson}
                  onChange={(e) => setSelectedDeliveryPerson(e.target.value)}
                >
                  <option value="">Select a delivery person</option>
                  {deliveryPersonnel.map(person => (
                    <option key={person._id} value={person._id}>
                      {person.name} ({person.email})
                    </option>
                  ))}
                </Form.Select>
                
                <div className="d-grid gap-2 mt-3">
                  <Button 
                    variant="primary"
                    disabled={!selectedDeliveryPerson}
                    onClick={handleAssignDelivery}
                  >
                    {modalLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Assigning...
                      </>
                    ) : 'Assign Delivery Person'}
                  </Button>
                </div>
              </Form.Group>
            </div>
          )}
        </Modal.Body>
      </Modal>
      
      {/* QR Code Modal */}
      <Modal show={showQRModal} onHide={() => setShowQRModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delivery QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
            <p className="mb-3">
              Scan this QR code to verify delivery details. 
              Share this with the delivery person.
            </p>
            
            {qrCodeData ? (
              <div className="border p-3 mb-3 rounded">
                <Image 
                  src={qrCodeData} 
                  alt="Delivery QR Code" 
                  className="img-fluid mb-3" 
                  style={{ maxWidth: '300px' }} 
                />
                <p className="mb-0"><small>QR code contains encrypted delivery details</small></p>
                
                {/* Display delivery information */}
                <div className="mt-3 text-start">
                  <h6 className="border-bottom pb-2 mb-2">Delivery Information:</h6>
                  
                  {/* Show delivery person if available from either source */}
                  {((currentOrderForDelivery && currentOrderForDelivery.deliveryPerson) || selectedDeliveryForQR) && (
                    <>
                      <p className="mb-1">
                        <strong>Delivery Person:</strong> {
                          selectedDeliveryForQR && selectedDeliveryForQR.deliveryPersonName ? 
                            selectedDeliveryForQR.deliveryPersonName :
                          currentOrderForDelivery && currentOrderForDelivery.deliveryPerson && currentOrderForDelivery.deliveryPerson.name ?
                            currentOrderForDelivery.deliveryPerson.name :
                            'Assigned'
                        }
                      </p>
                      
                      {/* Phone if available */}
                      {(currentOrderForDelivery && currentOrderForDelivery.deliveryPerson && currentOrderForDelivery.deliveryPerson.phone) && (
                        <p className="mb-1">
                          <strong>Contact:</strong> {currentOrderForDelivery.deliveryPerson.phone}
                        </p>
                      )}
                    </>
                  )}
                  
                  {/* Status information */}
                  <p className="mb-1">
                    <strong>Status:</strong> {
                      deliveryConfirmed ? 'In Transit' :
                      selectedDeliveryForQR ? selectedDeliveryForQR.status : 'Assigned'
                    }
                  </p>
                  
                  {/* Customer information if available */}
                  {((currentOrderForDelivery && currentOrderForDelivery.customerName) || 
                    (selectedDeliveryForQR && selectedDeliveryForQR.customerName)) && (
                    <p className="mb-1">
                      <strong>Customer:</strong> {
                        selectedDeliveryForQR ? selectedDeliveryForQR.customerName :
                        currentOrderForDelivery ? currentOrderForDelivery.customerName : 'N/A'
                      }
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="d-flex justify-content-center my-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
            
            {!deliveryConfirmed ? (
              <div className="alert alert-info">
                <strong>Next step:</strong> Confirm the delivery to update status to "Delivering" 
              </div>
            ) : (
              <div className="alert alert-success">
                <i className="bi bi-check-circle me-2"></i>
                Delivery confirmed! Status updated to "Delivering"
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowQRModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={downloadQRCode}>
            <i className="bi bi-download me-2"></i>
            Download QR Code
          </Button>
          {!deliveryConfirmed && (currentOrderForDelivery || selectedDeliveryForQR) && (
            <Button 
              variant="success" 
              onClick={() => {
                if (selectedDeliveryForQR) {
                  // If we have a selected delivery from the deliveries tab
                  handleConfirmDelivery({
                    _id: selectedDeliveryForQR._id,
                    order: selectedDeliveryForQR.order
                  });
                } else if (currentOrderForDelivery && currentOrderForDelivery.deliveryId) {
                  // Use the deliveryId we stored in the order object
                  const deliveryObj = {
                    _id: currentOrderForDelivery.deliveryId,
                    order: currentOrderForDelivery._id || currentOrderForDelivery.id
                  };
                  handleConfirmDelivery(deliveryObj);
                } else {
                  // If somehow we don't have the deliveryId, just update the order status
                  handleConfirmDelivery({
                    _id: null,
                    order: (currentOrderForDelivery && (currentOrderForDelivery._id || currentOrderForDelivery.id)) || 
                           (selectedDeliveryForQR && selectedDeliveryForQR.order)
                  });
                }
              }}
              disabled={modalLoading}
            >
              {modalLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Confirming...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Confirm Delivery
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderList;
