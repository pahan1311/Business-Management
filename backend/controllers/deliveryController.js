// Logic for delivery tracking
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');

// Get all deliveries with optional filter by status
exports.getDeliveries = async (req, res) => {
  try {
    const { status, deliveryPersonId } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (deliveryPersonId) {
      query.deliveryPerson = deliveryPersonId;
    }
    
    const deliveries = await Delivery.find(query)
      .populate('order', 'orderNumber totalAmount')
      .populate('deliveryPerson', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.status(200).json(deliveries);
  } catch (error) {
    console.error('Error in getDeliveries:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get delivery by ID
exports.getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('order')
      .populate('deliveryPerson', 'name email phone');
    
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    
    res.status(200).json(delivery);
  } catch (error) {
    console.error('Error in getDeliveryById:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get deliveries by delivery person
exports.getDeliveriesByDeliveryPerson = async (req, res) => {
  try {
    // Find deliveries assigned to this delivery person
    let deliveries = await Delivery.find({ deliveryPerson: req.params.deliveryPersonId })
      .populate('order')
      .sort({ createdAt: -1 });
    
    // For any deliveries that don't have detailed fields already,
    // enrich them with order information
    for (let i = 0; i < deliveries.length; i++) {
      if (!deliveries[i].orderId && deliveries[i].order) {
        deliveries[i].orderId = deliveries[i].order.orderNumber || 
                               deliveries[i].order._id.toString().slice(-6);
      }
      
      if (!deliveries[i].customerName && deliveries[i].order?.customer) {
        deliveries[i].customerName = deliveries[i].order.customer.name || 'Customer';
      }
      
      if (!deliveries[i].orderValue && deliveries[i].order) {
        deliveries[i].orderValue = deliveries[i].order.totalAmount || 0;
      }
      
      if (!deliveries[i].address && deliveries[i].order) {
        deliveries[i].address = deliveries[i].order.shippingAddress || 
                               deliveries[i].order.address || {};
      }
      
      await deliveries[i].save();
    }
    
    res.status(200).json(deliveries);
  } catch (error) {
    console.error('Error in getDeliveriesByDeliveryPerson:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Create new delivery
exports.createDelivery = async (req, res) => {
  try {
    console.log('Create delivery request body:', req.body);
    console.log('User making request:', req.user);
    
    const { 
      order: orderId, 
      deliveryPerson, 
      scheduledDate, 
      location, 
      notes,
      customerName,
      contactPhone,
      address,
      items,
      status
    } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }
    
    if (!deliveryPerson) {
      return res.status(400).json({ message: 'Delivery person is required' });
    }
    
    console.log('Looking for order with ID:', orderId);
    
    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
      console.error('Order not found with ID:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }
    
    console.log('Found order:', order);
    
    // Calculate order value
    let orderValue = 0;
    if (items && Array.isArray(items)) {
      orderValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    } else if (order.totalAmount) {
      orderValue = order.totalAmount;
    }
    
    const newDelivery = new Delivery({
      order: orderId,
      orderId: order.orderNumber || order._id.toString().slice(-6),
      customerName: customerName || order.customer?.name || 'Customer',
      contactPhone: contactPhone || order.customer?.phone || '',
      address: address || order.shippingAddress || order.address || {},
      orderValue: orderValue,
      items: items || order.items || [],
      deliveryPerson,
      scheduledDate,
      location,
      notes,
      status: status || 'pending'
    });
    
    const savedDelivery = await newDelivery.save();
    
    // Update order to indicate it's awaiting delivery
    order.status = 'ready';
    await order.save();
    
    res.status(201).json(savedDelivery);
  } catch (error) {
    console.error('Error in createDelivery:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Update delivery
exports.updateDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('order').populate('deliveryPerson', 'name email phone');
    
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    
    // If status is updated to 'delivered', update the delivered time
    if (req.body.status === 'delivered' && delivery.status === 'delivered' && !delivery.deliveredAt) {
      delivery.deliveredAt = new Date();
      await delivery.save();
      
      // Also update the order status
      await Order.findByIdAndUpdate(delivery.order._id, { status: 'delivered' });
    }
    
    res.status(200).json(delivery);
  } catch (error) {
    console.error('Error in updateDelivery:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Update delivery status
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Validate status value
    const validStatuses = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'rejected', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const delivery = await Delivery.findById(req.params.id);
    
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    
    // Update the status
    delivery.status = status;
    
    // If delivered, set the delivered time
    if (status === 'delivered') {
      delivery.deliveredAt = new Date();
      
      // Also update the order status
      await Order.findByIdAndUpdate(delivery.order, { status: 'delivered' });
    }
    
    await delivery.save();
    
    res.status(200).json(delivery);
  } catch (error) {
    console.error('Error in updateDeliveryStatus:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Assign delivery person to delivery
exports.assignDeliveryPerson = async (req, res) => {
  try {
    const { deliveryPersonId } = req.body;
    
    if (!deliveryPersonId) {
      return res.status(400).json({ message: 'Delivery person ID is required' });
    }
    
    const delivery = await Delivery.findById(req.params.id);
    
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    
    delivery.deliveryPerson = deliveryPersonId;
    delivery.status = 'assigned';
    await delivery.save();
    
    const updatedDelivery = await Delivery.findById(req.params.id)
      .populate('order')
      .populate('deliveryPerson', 'name email phone');
    
    res.status(200).json(updatedDelivery);
  } catch (error) {
    console.error('Error in assignDeliveryPerson:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Delete delivery
exports.deleteDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findByIdAndDelete(req.params.id);
    
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    
    res.status(200).json({ message: 'Delivery deleted successfully' });
  } catch (error) {
    console.error('Error in deleteDelivery:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
