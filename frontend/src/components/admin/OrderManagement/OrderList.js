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
import DeliveryPDFManager from '../../../services/deliveryPDFManager';

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
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfManager] = useState(() => new DeliveryPDFManager());
  
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
    if (!qrCodeData) {
      alert('No QR code available to download');
      return;
    }
    
    // Create comprehensive filename
    const deliveryId = selectedDeliveryForQR?._id?.toString().slice(-6) || 'unknown';
    const orderNumber = selectedDeliveryForQR?.orderNumber || 
                       (typeof selectedDeliveryForQR?.order === 'object' 
                         ? selectedDeliveryForQR?.order?._id?.toString().slice(-6) 
                         : selectedDeliveryForQR?.order?.toString().slice(-6)) || 'unknown';
    const customerName = (selectedDeliveryForQR?.customerName || 'customer').replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const filename = `comprehensive-delivery-qr_${orderNumber}_${deliveryId}_${customerName}_${timestamp}.png`;
    
    // Create a download link for the QR code
    const link = document.createElement('a');
    link.href = qrCodeData;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`Downloaded QR code as: ${filename}`);
  };
  
  // Utility function for status badge colors
  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'processing': return 'primary';
      case 'ready': return 'success';
      case 'out_for_delivery': case 'in_transit': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': case 'rejected': return 'danger';
      case 'assigned': return 'secondary';
      default: return 'secondary';
    }
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

      // Validate order ID format (allow both ObjectId format and shorter order numbers)
      const orderIdString = delivery.order.toString();
      if (!orderIdString.match(/^[0-9a-fA-F]{24}$/) && !orderIdString.match(/^[0-9a-fA-F]{6,}$/)) {
        console.warn("Invalid order ID format:", delivery.order);
        // Instead of throwing error, let's try to proceed with the ID we have
        console.log("Attempting to proceed with order ID:", delivery.order);
      }
      
      // Fetch the related order to get all necessary details
      console.log("Fetching order with ID:", delivery.order);
      let orderData;
      try {
        const orderResponse = await orderAPI.getById(delivery.order);
        orderData = orderResponse.data;
        console.log("Retrieved order data:", orderData);
      } catch (orderError) {
        console.error("Failed to fetch order:", orderError);
        throw new Error(`Failed to fetch order details: ${orderError.response?.data?.message || orderError.message}`);
      }
      
      // Fetch the delivery person details if needed
      let deliveryPersonData = null;
      if (delivery.deliveryPerson) {
        try {
          // Validate delivery person ID format (allow both ObjectId format and shorter IDs)
          const deliveryPersonIdString = delivery.deliveryPerson.toString();
          if (deliveryPersonIdString.match(/^[0-9a-fA-F]{24}$/) || deliveryPersonIdString.match(/^[0-9a-fA-F]{6,}$/)) {
            console.log("Fetching delivery person with ID:", delivery.deliveryPerson);
            const personResponse = await userAPI.getById(delivery.deliveryPerson);
            deliveryPersonData = personResponse.data;
            console.log("Retrieved delivery person data:", deliveryPersonData);
          } else {
            console.warn("Invalid delivery person ID format:", delivery.deliveryPerson);
          }
        } catch (err) {
          console.error('Failed to fetch delivery person details:', err);
          // Don't throw error for delivery person fetch failure, just continue without it
        }
      }
      
      // Generate comprehensive QR code data for the delivery
      const qrDataObj = {
        // Delivery Information
        delivery: {
          id: delivery._id?.toString() || '',
          status: delivery.status || 'unknown',
          assignedDate: delivery.assignedAt || delivery.createdAt || new Date().toISOString(),
          deliveryDate: delivery.deliveryDate || '',
          address: delivery.address || orderData.shippingAddress || orderData.address || 'Address not available',
          notes: delivery.notes || '',
          trackingNumber: delivery.trackingNumber || delivery._id?.toString().slice(-8).toUpperCase() || 'N/A'
        },
        
        // Order Information
        order: {
          id: (orderData._id || orderData.id)?.toString() || '',
          orderNumber: orderData.orderNumber || (orderData._id || orderData.id)?.toString().slice(-6).toUpperCase() || 'N/A',
          status: orderData.status || 'unknown',
          totalAmount: (orderData.totalAmount || orderData.total || 0).toString(),
          orderDate: orderData.createdAt || orderData.orderDate || new Date().toISOString(),
          paymentMethod: orderData.paymentMethod || 'N/A',
          paymentStatus: orderData.paymentStatus || 'pending',
          items: (delivery.items || orderData.items || []).map(item => ({
            productId: (item.product?._id || item.productId)?.toString() || '',
            productName: item.product?.name || item.productName || item.name || 'Unknown Product',
            quantity: parseInt(item.quantity) || 0,
            price: parseFloat(item.price || item.product?.price || 0).toFixed(2),
            total: (parseInt(item.quantity || 0) * parseFloat(item.price || item.product?.price || 0)).toFixed(2),
            sku: item.product?.sku || item.sku || '',
            category: item.product?.category || item.category || ''
          })),
          itemCount: (delivery.items || orderData.items || []).length,
          totalItems: (delivery.items || orderData.items || []).reduce((sum, item) => sum + parseInt(item.quantity || 0), 0)
        },
        
        // Customer Information
        customer: {
          id: (orderData.customer?._id || orderData.customerId)?.toString() || '',
          name: delivery.customerName || orderData.customerName || orderData.customer?.name || 'Unknown Customer',
          email: orderData.customer?.email || orderData.customerEmail || '',
          phone: orderData.customer?.phone || orderData.customerPhone || '',
          address: {
            shipping: delivery.address || orderData.shippingAddress || orderData.address || 'Address not available',
            billing: orderData.billingAddress || orderData.address || 'Same as shipping'
          }
        },
        
        // Delivery Person Information
        deliveryPerson: deliveryPersonData ? {
          id: deliveryPersonData._id?.toString() || '',
          name: deliveryPersonData.name || 'Unknown',
          phone: deliveryPersonData.phone || 'N/A',
          email: deliveryPersonData.email || 'N/A',
          employeeId: deliveryPersonData.employeeId || 'N/A',
          department: deliveryPersonData.department || 'Delivery'
        } : {
          id: (delivery.deliveryPerson)?.toString() || '',
          name: delivery.deliveryPersonName || "Unassigned",
          phone: "N/A",
          email: "N/A",
          status: "unassigned"
        },
        
        // System Information
        system: {
          generatedAt: new Date().toISOString(),
          generatedBy: 'Order Management System',
          version: '1.0',
          qrType: 'DELIVERY_ORDER',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Valid for 30 days
        },
        
        // Instructions for delivery
        instructions: {
          deliveryInstructions: orderData.deliveryInstructions || delivery.specialInstructions || '',
          contactCustomer: 'Call customer 15 minutes before delivery',
          verificationRequired: true,
          signatureRequired: parseFloat(orderData.totalAmount || orderData.total || 0) > 100,
          photoRequired: true
        }
      };
      
      console.log("Comprehensive QR data object:", qrDataObj);
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
      
      // Fallback: Generate QR code with comprehensive delivery data we have
      try {
        console.log("Attempting fallback QR generation with comprehensive available data");
        const fallbackQrDataObj = {
          // Delivery Information
          delivery: {
            id: delivery._id?.toString() || '',
            status: delivery.status || 'unknown',
            address: delivery.address || 'Address not available',
            trackingNumber: delivery._id?.toString().slice(-8).toUpperCase() || 'N/A',
            assignedDate: delivery.createdAt || new Date().toISOString()
          },
          
          // Order Information
          order: {
            id: (delivery.order)?.toString() || '',
            orderNumber: delivery.orderNumber || (delivery.order)?.toString().slice(-6).toUpperCase() || 'Unknown',
            status: delivery.orderStatus || 'unknown',
            items: (delivery.items || []).map(item => ({
              productName: item.product?.name || item.productName || item.name || 'Unknown Product',
              quantity: parseInt(item.quantity) || 0,
              price: parseFloat(item.price || item.product?.price || 0).toFixed(2)
            })),
            itemCount: (delivery.items || []).length
          },
          
          // Customer Information
          customer: {
            name: delivery.customerName || 'Unknown Customer',
            address: delivery.address || 'Address not available'
          },
          
          // Delivery Person Information
          deliveryPerson: {
            id: (delivery.deliveryPerson)?.toString() || 'unassigned',
            name: delivery.deliveryPersonName || 'Unassigned',
            phone: 'Contact admin for details'
          },
          
          // System Information
          system: {
            generatedAt: new Date().toISOString(),
            qrType: 'DELIVERY_ORDER_FALLBACK',
            note: 'Generated with limited data - some details may be incomplete',
            dataSource: 'delivery_record_only'
          },
          
          // Instructions
          instructions: {
            note: 'Contact system administrator for complete order details',
            verificationRequired: true
          }
        };
        
        console.log("Comprehensive fallback QR data object:", fallbackQrDataObj);
        const fallbackQrData = JSON.stringify(fallbackQrDataObj);
        
        const qrCodeImage = await QRCodeService.generateQRCode(fallbackQrData);
        console.log("Fallback QR code generated successfully");
        setQRCodeData(qrCodeImage);
        setSelectedDeliveryForQR(delivery);
        
        // Show QR code modal
        setDeliveryConfirmed(delivery.status === 'in_transit');
        setShowQRModal(true);
        
        // Show a warning about limited data
        alert("QR code generated with limited data due to API issues. Some details may be missing.");
      } catch (fallbackError) {
        console.error('Fallback QR generation also failed:', fallbackError);
        alert(`Error generating QR code: ${error.message || 'Unknown error'}. Fallback also failed.`);
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleGeneratePDFReport = async (delivery) => {
    setPdfGenerating(true);
    try {
      console.log("Generating PDF report for delivery:", delivery);
      
      // Find the related order data
      const relatedOrder = orders.find(order => 
        order._id === delivery.order || order.id === delivery.order
      );

      if (!relatedOrder) {
        console.warn("No related order found for delivery, generating PDF with available data");
      }

      // Generate PDF and upload to Google Drive
      const result = await pdfManager.generateAndUploadDeliveryPDF(delivery, relatedOrder);
      
      if (result.success) {
        // Create a custom modal for QR code display with download option
        const qrWindow = window.open('', '_blank', 'width=500,height=600');
        qrWindow.document.write(`
          <html>
            <head>
              <title>PDF Report - QR Code Access</title>
              <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
              <style>
                body { padding: 20px; text-align: center; font-family: Arial, sans-serif; }
                .qr-container { margin: 20px 0; }
                .btn-group { margin: 15px 0; }
                .info-card { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <h3 class="text-primary">📄 PDF Report Generated Successfully</h3>
                
                <div class="info-card">
                  <h5>Delivery Information</h5>
                  <p><strong>Delivery ID:</strong> ${delivery.id || delivery._id}</p>
                  <p><strong>Customer:</strong> ${delivery.customerName || 'N/A'}</p>
                  <p><strong>File:</strong> ${result.filename}</p>
                </div>
                
                <div class="qr-container">
                  <h5>Scan QR Code to Access PDF</h5>
                  <img src="${result.qrCodeData}" alt="QR Code" style="max-width: 250px; border: 1px solid #ddd; padding: 10px;"/>
                </div>
                
                <div class="btn-group d-flex flex-column gap-2">
                  <button class="btn btn-success" onclick="downloadQRCode()">
                    📥 Download QR Code
                  </button>
                  <a href="${result.uploadResult.shareableLink}" target="_blank" class="btn btn-primary">
                    🔗 Open PDF in Google Drive
                  </a>
                  <button class="btn btn-secondary" onclick="window.close()">
                    ✕ Close
                  </button>
                </div>
                
                ${result.uploadResult.note ? `
                  <div class="alert alert-info mt-3">
                    <small>${result.uploadResult.note}</small>
                  </div>
                ` : ''}
              </div>
              
              <script>
                function downloadQRCode() {
                  const link = document.createElement('a');
                  link.download = 'qr_code_${delivery.id || delivery._id}_${new Date().toISOString().split('T')[0]}.png';
                  link.href = '${result.qrCodeData}';
                  link.click();
                }
              </script>
            </body>
          </html>
        `);
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
      
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert(`Error generating PDF report: ${error.message || 'Unknown error'}`);
    } finally {
      setPdfGenerating(false);
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
                              variant="outline-success"
                              title="Generate PDF Report"
                              onClick={() => handleGeneratePDFReport(delivery)}
                              disabled={pdfGenerating}
                            >
                              {pdfGenerating ? (
                                <i className="bi bi-hourglass-split"></i>
                              ) : (
                                <i className="bi bi-file-earmark-pdf"></i>
                              )}
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
      
      {/* Enhanced QR Code Modal with Comprehensive Details */}
      <Modal show={showQRModal} onHide={() => setShowQRModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-qr-code me-2"></i>
            Comprehensive Delivery QR Code
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            {/* QR Code Section */}
            <div className="col-md-5">
              <div className="text-center">
                <h6 className="mb-3">QR Code</h6>
                {qrCodeData ? (
                  <div className="border p-3 mb-3 rounded bg-light">
                    <Image 
                      src={qrCodeData} 
                      alt="Comprehensive Delivery QR Code" 
                      className="img-fluid mb-2" 
                      style={{ maxWidth: '250px', minHeight: '250px' }} 
                    />
                    <p className="mb-0 text-muted">
                      <small>
                        <i className="bi bi-shield-check me-1"></i>
                        Contains complete order & delivery details
                      </small>
                    </p>
                  </div>
                ) : (
                  <div className="d-flex justify-content-center my-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Generating QR Code...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Comprehensive Details Section */}
            <div className="col-md-7">
              <div className="h-100" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                
                {/* Order Information */}
                {selectedDeliveryForQR && (
                  <div className="mb-4">
                    <h6 className="text-primary border-bottom pb-2 mb-3">
                      <i className="bi bi-cart3 me-2"></i>Order Details
                    </h6>
                    <div className="row">
                      <div className="col-6">
                        <p className="mb-1"><strong>Order ID:</strong></p>
                        <p className="text-muted small mb-2">
                          {typeof selectedDeliveryForQR.order === 'object' 
                            ? selectedDeliveryForQR.order?._id || selectedDeliveryForQR.order?.id || 'N/A'
                            : selectedDeliveryForQR.order?.toString() || 'N/A'}
                        </p>
                      </div>
                      <div className="col-6">
                        <p className="mb-1"><strong>Delivery ID:</strong></p>
                        <p className="text-muted small mb-2">
                          {selectedDeliveryForQR._id?.toString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <p className="mb-1"><strong>Status:</strong> 
                      <span className={`badge ms-2 bg-${getStatusBadgeColor(selectedDeliveryForQR.status)}`}>
                        {selectedDeliveryForQR.status || 'Unknown'}
                      </span>
                    </p>
                    {selectedDeliveryForQR.totalAmount && (
                      <p className="mb-1"><strong>Total Amount:</strong> 
                        <span className="text-success fw-bold ms-2">
                          ${typeof selectedDeliveryForQR.totalAmount === 'object' 
                            ? selectedDeliveryForQR.totalAmount.toString() 
                            : selectedDeliveryForQR.totalAmount}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {/* Customer Information */}
                {selectedDeliveryForQR && (
                  <div className="mb-4">
                    <h6 className="text-success border-bottom pb-2 mb-3">
                      <i className="bi bi-person me-2"></i>Customer Information
                    </h6>
                    <p className="mb-1"><strong>Name:</strong> {selectedDeliveryForQR.customerName || 'N/A'}</p>
                    <p className="mb-1"><strong>Delivery Address:</strong></p>
                    <p className="text-muted small mb-2">{selectedDeliveryForQR.address || 'Address not available'}</p>
                  </div>
                )}

                {/* Delivery Person Information */}
                <div className="mb-4">
                  <h6 className="text-warning border-bottom pb-2 mb-3">
                    <i className="bi bi-truck me-2"></i>Delivery Personnel
                  </h6>
                  {selectedDeliveryForQR && selectedDeliveryForQR.deliveryPersonName ? (
                    <>
                      <p className="mb-1"><strong>Name:</strong> {selectedDeliveryForQR.deliveryPersonName}</p>
                      <p className="mb-1"><strong>ID:</strong> 
                        {typeof selectedDeliveryForQR.deliveryPerson === 'object' 
                          ? selectedDeliveryForQR.deliveryPerson?._id?.toString() || selectedDeliveryForQR.deliveryPerson?.id?.toString() || 'N/A'
                          : selectedDeliveryForQR.deliveryPerson?.toString() || 'N/A'}
                      </p>
                    </>
                  ) : currentOrderForDelivery && currentOrderForDelivery.deliveryPerson ? (
                    <>
                      <p className="mb-1"><strong>Name:</strong> {currentOrderForDelivery.deliveryPerson.name || 'N/A'}</p>
                      <p className="mb-1"><strong>Contact:</strong> {currentOrderForDelivery.deliveryPerson.phone || 'N/A'}</p>
                      <p className="mb-1"><strong>ID:</strong> 
                        {typeof currentOrderForDelivery.deliveryPerson._id === 'object' 
                          ? currentOrderForDelivery.deliveryPerson._id?.toString() || 'N/A'
                          : currentOrderForDelivery.deliveryPerson._id?.toString() || 'N/A'}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted">No delivery person assigned yet</p>
                  )}
                </div>

                {/* Items Information */}
                {(selectedDeliveryForQR?.items || currentOrderForDelivery?.items) && (
                  <div className="mb-4">
                    <h6 className="text-info border-bottom pb-2 mb-3">
                      <i className="bi bi-box-seam me-2"></i>Items ({(selectedDeliveryForQR?.items || currentOrderForDelivery?.items || []).length})
                    </h6>
                    <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                      {(selectedDeliveryForQR?.items || currentOrderForDelivery?.items || []).slice(0, 5).map((item, index) => {
                        const productName = item.product?.name || item.productName || item.name || 'Unknown Product';
                        const quantity = item.quantity || 0;
                        const price = item.price || item.product?.price || 0;
                        const total = (quantity * price).toFixed(2);
                        
                        return (
                          <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                            <div>
                              <small className="fw-bold">{productName}</small>
                              <div className="text-muted" style={{ fontSize: '0.75em' }}>
                                Qty: {quantity} × ${price}
                              </div>
                            </div>
                            <small className="text-success fw-bold">
                              ${total}
                            </small>
                          </div>
                        );
                      })}
                      {(selectedDeliveryForQR?.items || currentOrderForDelivery?.items || []).length > 5 && (
                        <p className="text-muted text-center mb-0">
                          <small>+ {(selectedDeliveryForQR?.items || currentOrderForDelivery?.items || []).length - 5} more items</small>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* QR Code Information */}
                <div className="mb-3">
                  <h6 className="text-secondary border-bottom pb-2 mb-3">
                    <i className="bi bi-info-circle me-2"></i>QR Code Information
                  </h6>
                  <p className="mb-1"><small><strong>Generated:</strong> {new Date().toLocaleString()}</small></p>
                  <p className="mb-1"><small><strong>Valid Until:</strong> {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</small></p>
                  <p className="mb-0"><small><strong>Type:</strong> Comprehensive Delivery Order</small></p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Status Alert */}
          <div className="mt-3">
            {!deliveryConfirmed ? (
              <div className="alert alert-info mb-0">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Next Step:</strong> Confirm the delivery to update status to "In Transit"
              </div>
            ) : (
              <div className="alert alert-success mb-0">
                <i className="bi bi-check-circle me-2"></i>
                <strong>Confirmed!</strong> Delivery status updated to "In Transit"
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
