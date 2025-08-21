const { Delivery, Order, Customer, User } = require('../models');
const { Op } = require('sequelize');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES, DELIVERY_STATUS, RESPONSE_MESSAGES } = require('../utils/constants');
const { formatResponse, getPaginationData } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get all deliveries
 */
const getAllDeliveries = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    deliveryPersonId, 
    dateFrom, 
    dateTo,
    sortBy = 'createdAt', 
    sortOrder = 'DESC' 
  } = req.query;
  
  const where = {};
  if (status) where.status = status;
  if (deliveryPersonId) where.deliveryPersonId = deliveryPersonId;
  if (dateFrom || dateTo) {
    where.scheduledDate = {};
    if (dateFrom) where.scheduledDate[Op.gte] = new Date(dateFrom);
    if (dateTo) where.scheduledDate[Op.lte] = new Date(dateTo);
  }

  const offset = (page - 1) * limit;
  
  const { count, rows: deliveries } = await Delivery.findAndCountAll({
    where,
    include: [
      {
        model: Order,
        as: 'order',
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phone']
        }]
      },
      {
        model: User,
        as: 'deliveryPerson',
        attributes: ['id', 'firstName', 'lastName', 'phone']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder.toUpperCase()]],
    distinct: true
  });

  const pagination = getPaginationData(count, page, limit);

  res.json(formatResponse({
    deliveries,
    pagination
  }, 'Deliveries retrieved successfully'));
});

/**
 * Get delivery person's deliveries
 */
const getMyDeliveries = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, date } = req.query;
  const deliveryPersonId = req.user.id;
  
  const where = { deliveryPersonId };
  if (status) where.status = status;
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    where.scheduledDate = {
      [Op.gte]: startDate,
      [Op.lt]: endDate
    };
  }

  const offset = (page - 1) * limit;
  
  const { count, rows: deliveries } = await Delivery.findAndCountAll({
    where,
    include: [
      {
        model: Order,
        as: 'order',
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'address']
        }]
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['scheduledDate', 'ASC']],
    distinct: true
  });

  const pagination = getPaginationData(count, page, limit);

  res.json(formatResponse({
    deliveries,
    pagination
  }, 'Deliveries retrieved successfully'));
});

/**
 * Create new delivery
 */
const createDelivery = asyncHandler(async (req, res) => {
  const {
    orderId,
    deliveryPersonId,
    scheduledDate,
    estimatedDelivery,
    deliveryAddress,
    notes,
    priority = 'normal'
  } = req.body;

  // Check if order exists and doesn't already have a delivery
  const order = await Order.findByPk(orderId);
  if (!order) {
    throw new AppError(
      'Order not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  const existingDelivery = await Delivery.findOne({ where: { orderId } });
  if (existingDelivery) {
    throw new AppError(
      'Delivery already exists for this order',
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.DUPLICATE_RESOURCE
    );
  }

  // Check if delivery person exists and has delivery role
  const deliveryPerson = await User.findByPk(deliveryPersonId);
  if (!deliveryPerson || deliveryPerson.role !== 'delivery') {
    throw new AppError(
      'Invalid delivery person',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_INPUT
    );
  }

  const delivery = await Delivery.create({
    orderId,
    deliveryPersonId,
    scheduledDate,
    estimatedDelivery,
    deliveryAddress: deliveryAddress || order.shippingAddress,
    notes,
    priority,
    status: DELIVERY_STATUS.PENDING,
    trackingNumber: generateTrackingNumber()
  });

  // Update order status
  await order.update({ status: 'processing' });

  // Fetch complete delivery with relations
  const completeDelivery = await Delivery.findByPk(delivery.id, {
    include: [
      {
        model: Order,
        as: 'order',
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phone']
        }]
      },
      {
        model: User,
        as: 'deliveryPerson',
        attributes: ['id', 'firstName', 'lastName', 'phone']
      }
    ]
  });

  logger.info(`New delivery created: ${delivery.id} for order: ${orderId} by user: ${req.user.id}`);

  res.status(HTTP_STATUS.CREATED).json(
    formatResponse(completeDelivery, 'Delivery created successfully')
  );
});

/**
 * Get delivery by ID
 */
const getDeliveryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const delivery = await Delivery.findByPk(id, {
    include: [
      {
        model: Order,
        as: 'order',
        include: [{
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'phone', 'address']
        }]
      },
      {
        model: User,
        as: 'deliveryPerson',
        attributes: ['id', 'firstName', 'lastName', 'phone']
      }
    ]
  });

  if (!delivery) {
    throw new AppError(
      'Delivery not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  res.json(formatResponse(delivery, 'Delivery retrieved successfully'));
});

/**
 * Update delivery status
 */
const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes, actualDeliveryDate, recipientName, proof } = req.body;
  
  const delivery = await Delivery.findByPk(id, {
    include: [{
      model: Order,
      as: 'order'
    }]
  });

  if (!delivery) {
    throw new AppError(
      'Delivery not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  const updateData = {
    status,
    notes: notes || delivery.notes,
    updatedAt: new Date()
  };

  if (status === DELIVERY_STATUS.DELIVERED) {
    updateData.actualDeliveryDate = actualDeliveryDate || new Date();
    updateData.recipientName = recipientName;
    updateData.proof = proof; // Could be signature, photo, etc.
    
    // Update order status to delivered
    await delivery.order.update({ status: 'delivered' });
  }

  if (status === DELIVERY_STATUS.IN_TRANSIT) {
    updateData.dispatchedAt = new Date();
  }

  await delivery.update(updateData);

  logger.info(`Delivery ${delivery.id} status updated to ${status} by user: ${req.user.id}`);

  res.json(formatResponse(delivery, 'Delivery status updated successfully'));
});

/**
 * Assign delivery person
 */
const assignDeliveryPerson = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { deliveryPersonId } = req.body;
  
  const delivery = await Delivery.findByPk(id);
  if (!delivery) {
    throw new AppError(
      'Delivery not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  // Check if delivery person exists and has delivery role
  const deliveryPerson = await User.findByPk(deliveryPersonId);
  if (!deliveryPerson || deliveryPerson.role !== 'delivery') {
    throw new AppError(
      'Invalid delivery person',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_INPUT
    );
  }

  await delivery.update({ 
    deliveryPersonId,
    status: DELIVERY_STATUS.ASSIGNED 
  });

  logger.info(`Delivery ${delivery.id} assigned to ${deliveryPersonId} by user: ${req.user.id}`);

  res.json(formatResponse(delivery, 'Delivery person assigned successfully'));
});

/**
 * Track delivery by tracking number
 */
const trackDelivery = asyncHandler(async (req, res) => {
  const { trackingNumber } = req.params;
  
  const delivery = await Delivery.findOne({
    where: { trackingNumber },
    include: [
      {
        model: Order,
        as: 'order',
        attributes: ['id', 'orderNumber', 'totalAmount']
      }
    ]
  });

  if (!delivery) {
    throw new AppError(
      'Delivery not found with this tracking number',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  // Return public tracking information
  const trackingInfo = {
    trackingNumber: delivery.trackingNumber,
    status: delivery.status,
    scheduledDate: delivery.scheduledDate,
    estimatedDelivery: delivery.estimatedDelivery,
    dispatchedAt: delivery.dispatchedAt,
    actualDeliveryDate: delivery.actualDeliveryDate,
    orderNumber: delivery.order.orderNumber
  };

  res.json(formatResponse(trackingInfo, 'Delivery tracking information retrieved'));
});

/**
 * Get delivery statistics
 */
const getDeliveryStats = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  const where = {};
  
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
    if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
  }

  const stats = {
    totalDeliveries: await Delivery.count({ where }),
    pendingDeliveries: await Delivery.count({ 
      where: { ...where, status: DELIVERY_STATUS.PENDING } 
    }),
    inTransitDeliveries: await Delivery.count({ 
      where: { ...where, status: DELIVERY_STATUS.IN_TRANSIT } 
    }),
    deliveredCount: await Delivery.count({ 
      where: { ...where, status: DELIVERY_STATUS.DELIVERED } 
    }),
    failedDeliveries: await Delivery.count({ 
      where: { ...where, status: DELIVERY_STATUS.FAILED } 
    })
  };

  stats.completionRate = stats.totalDeliveries > 0 
    ? ((stats.deliveredCount / stats.totalDeliveries) * 100).toFixed(2)
    : 0;

  res.json(formatResponse(stats, 'Delivery statistics retrieved successfully'));
});

/**
 * Generate unique tracking number
 */
const generateTrackingNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `TRK${timestamp}${random}`;
};

module.exports = {
  getAllDeliveries,
  getMyDeliveries,
  createDelivery,
  getDeliveryById,
  updateDeliveryStatus,
  assignDeliveryPerson,
  trackDelivery,
  getDeliveryStats
};
