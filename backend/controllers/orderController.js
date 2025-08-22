// Logic for order management
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const User = require('../models/User');

// Get all orders
exports.getOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const status = req.query.status;
    
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const orders = await Order.find(query)
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    const total = await Order.countDocuments(query);
    
    res.status(200).json({
      orders,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error in getOrders:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    let order;
    
    // Check if it's a valid MongoDB ObjectId format
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a full ObjectId
      order = await Order.findById(id)
        .populate('customer', 'name email phone')
        .populate('items.product');
    } else {
      // Try to find by order number or other identifier
      order = await Order.findOne({
        $or: [
          { orderNumber: id },
          { _id: id }, // In case it's still a valid ObjectId
          { orderNumber: { $regex: id, $options: 'i' } } // Case insensitive partial match
        ]
      })
        .populate('customer', 'name email phone')
        .populate('items.product');
    }
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Error in getOrderById:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get orders by customer
exports.getOrdersByCustomer = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.params.customerId })
      .sort({ createdAt: -1 });
    
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error in getOrdersByCustomer:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const { customer, items, totalAmount, paymentMethod, deliveryAddress, notes } = req.body;
    
    if (!customer || !items || items.length === 0 || !totalAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check inventory and update stock quantities
    for (const item of items) {
      const product = await Inventory.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }
      
      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Only ${product.quantity} available.` 
        });
      }
      
      // Update stock
      product.quantity -= item.quantity;
      await product.save();
    }
    
    const newOrder = new Order({
      customer,
      items,
      totalAmount,
      paymentMethod,
      deliveryAddress,
      notes
    });
    
    const savedOrder = await newOrder.save();
    
    // Populate customer info for the response
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('customer', 'name email')
      .populate('items.product');
    
    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Update order
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Don't allow updating certain fields if order is past certain statuses
    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Cannot update an order that has already been delivered or cancelled' 
      });
    }
    
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('customer', 'name email');
    
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error in updateOrder:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Validate status value
    const validStatuses = ['pending', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // If cancelling order, restore inventory quantities
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await Inventory.updateOne(
          { _id: item.product },
          { $inc: { quantity: item.quantity } }
        );
      }
    }
    
    order.status = status;
    await order.save();
    
    res.status(200).json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Delete order
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // If order is not delivered or cancelled, restore inventory quantities
    if (!['delivered', 'cancelled'].includes(order.status)) {
      for (const item of order.items) {
        await Inventory.updateOne(
          { _id: item.product },
          { $inc: { quantity: item.quantity } }
        );
      }
    }
    
    await order.remove();
    
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error in deleteOrder:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Assign staff to an order
exports.assignStaff = async (req, res) => {
  try {
    const { staffId } = req.body;
    
    if (!staffId) {
      return res.status(400).json({ message: 'Staff ID is required' });
    }
    
    // Verify the order exists
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Verify the staff exists and has the staff role
    const staff = await User.findOne({ _id: staffId, role: 'staff' });
    if (!staff) {
      return res.status(400).json({ message: 'Invalid staff ID or user is not a staff member' });
    }
    
    // Update the order with the assigned staff
    order.assignedStaff = staffId;
    
    // If the order is in 'pending' status, update it to 'confirmed'
    if (order.status === 'pending') {
      order.status = 'confirmed';
    }
    
    await order.save();
    
    res.status(200).json({
      message: 'Staff assigned successfully',
      order: {
        _id: order._id,
        status: order.status,
        assignedStaff: staffId
      }
    });
  } catch (error) {
    console.error('Error in assignStaff:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
