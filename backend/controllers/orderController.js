/**
 * Order Controller
 */

const { Order, OrderItem, Customer, Product, Delivery, User } = require('../models');
const { Op } = require('sequelize');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES, ORDER_STATUS, RESPONSE_MESSAGES } = require('../utils/constants');
const { formatResponse, getPaginationData } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get all orders
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, customerId, dateFrom, dateTo, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
  
  const where = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
    if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
  }

  const offset = (page - 1) * limit;
  
  const { count, rows: orders } = await Order.findAndCountAll({
    where,
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['name', 'price']
        }]
      },
      {
        model: Delivery,
        as: 'delivery',
        attributes: ['id', 'status', 'trackingNumber']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder.toUpperCase()]],
    distinct: true
  });

  const pagination = getPaginationData(count, page, limit);

  res.json(formatResponse({
    orders,
    pagination
  }, 'Orders retrieved successfully'));
});

/**
 * Get customer's orders
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const customerId = req.user.customerId; // Assuming customer ID is in user object
  
  const where = { customerId };
  if (status) where.status = status;

  const offset = (page - 1) * limit;
  
  const { count, rows: orders } = await Order.findAndCountAll({
    where,
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['name', 'price', 'description']
        }]
      },
      {
        model: Delivery,
        as: 'delivery',
        attributes: ['id', 'status', 'trackingNumber', 'estimatedDelivery']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    distinct: true
  });

  const pagination = getPaginationData(count, page, limit);

  res.json(formatResponse({
    orders,
    pagination
  }, 'Orders retrieved successfully'));
});

/**
 * Create new order
 */
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, notes } = req.body;
  const customerId = req.user.customerId;

  if (!items || items.length === 0) {
    throw new AppError(
      'Order must contain at least one item',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_INPUT
    );
  }

  let totalAmount = 0;
  const orderItems = [];

  // Validate items and calculate total
  for (const item of items) {
    const product = await Product.findByPk(item.productId);
    if (!product) {
      throw new AppError(
        `Product with ID ${item.productId} not found`,
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    if (product.stock < item.quantity) {
      throw new AppError(
        `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INSUFFICIENT_STOCK
      );
    }

    const itemTotal = product.price * item.quantity;
    totalAmount += itemTotal;

    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price,
      totalPrice: itemTotal
    });
  }

  // Create order
  const order = await Order.create({
    customerId,
    totalAmount,
    status: ORDER_STATUS.PENDING,
    shippingAddress,
    notes,
    orderNumber: generateOrderNumber()
  });

  // Create order items
  for (const item of orderItems) {
    await OrderItem.create({
      ...item,
      orderId: order.id
    });

    // Update product stock
    await Product.decrement('stock', {
      by: item.quantity,
      where: { id: item.productId }
    });
  }

  // Fetch complete order with items
  const completeOrder = await Order.findByPk(order.id, {
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['name', 'price']
        }]
      }
    ]
  });

  logger.info(`New order created: ${order.id} by customer: ${customerId}`);

  res.status(HTTP_STATUS.CREATED).json(
    formatResponse(completeOrder, 'Order created successfully')
  );
});

/**
 * Get order by ID
 */
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const order = await Order.findByPk(id, {
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
      },
      {
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['name', 'price', 'description']
        }]
      },
      {
        model: Delivery,
        as: 'delivery'
      }
    ]
  });

  if (!order) {
    throw new AppError(
      'Order not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  res.json(formatResponse(order, 'Order retrieved successfully'));
});

/**
 * Update order status
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  
  const order = await Order.findByPk(id);
  if (!order) {
    throw new AppError(
      'Order not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  await order.update({ 
    status, 
    notes: notes || order.notes,
    updatedAt: new Date()
  });

  logger.info(`Order ${order.id} status updated to ${status} by user: ${req.user.id}`);

  res.json(formatResponse(order, 'Order status updated successfully'));
});

/**
 * Cancel order
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  const order = await Order.findByPk(id, {
    include: [{
      model: OrderItem,
      as: 'items'
    }]
  });

  if (!order) {
    throw new AppError(
      'Order not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  if (order.status === ORDER_STATUS.DELIVERED) {
    throw new AppError(
      'Cannot cancel delivered order',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_OPERATION
    );
  }

  // Restore product stock
  for (const item of order.items) {
    await Product.increment('stock', {
      by: item.quantity,
      where: { id: item.productId }
    });
  }

  await order.update({
    status: ORDER_STATUS.CANCELLED,
    notes: reason,
    cancelledAt: new Date()
  });

  logger.info(`Order ${order.id} cancelled. Reason: ${reason}`);

  res.json(formatResponse(order, 'Order cancelled successfully'));
});

/**
 * Generate unique order number
 */
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD${timestamp}${random}`;
};

module.exports = {
  getAllOrders,
  getMyOrders,
  createOrder,
  getOrderById,
  updateOrderStatus,
  cancelOrder
};
