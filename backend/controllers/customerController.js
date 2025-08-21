/**
 * Customer Controller
 */

const { Customer, User, Order, OrderItem, Product } = require('../models');
const { Op } = require('sequelize');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES, USER_STATUS, RESPONSE_MESSAGES } = require('../utils/constants');
const { formatResponse, getPaginationData } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get all customers
 */
const getAllCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
  
  const where = {};
  if (search) {
    where[Op.or] = [
      { firstName: { [Op.like]: `%${search}%` } },
      { lastName: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } }
    ];
  }
  if (status) {
    where.status = status;
  }

  const offset = (page - 1) * limit;
  
  const { count, rows: customers } = await Customer.findAndCountAll({
    where,
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'role', 'lastLogin', 'emailVerifiedAt']
    }],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder.toUpperCase()]],
    distinct: true
  });

  const pagination = getPaginationData(count, page, limit);

  res.json(formatResponse({
    customers,
    pagination
  }, 'Customers retrieved successfully'));
});

/**
 * Get customer by ID
 */
const getCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const customer = await Customer.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'role', 'lastLogin', 'emailVerifiedAt']
      },
      {
        model: Order,
        as: 'orders',
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [{
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['name', 'price']
          }]
        }]
      }
    ]
  });

  if (!customer) {
    throw new AppError(
      'Customer not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  res.json(formatResponse(customer, 'Customer retrieved successfully'));
});

/**
 * Create new customer
 */
const createCustomer = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    address,
    emergencyContact
  } = req.body;

  // Check if customer already exists
  const existingCustomer = await Customer.findOne({ where: { email } });
  if (existingCustomer) {
    throw new AppError(
      'Customer with this email already exists',
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.DUPLICATE_RESOURCE
    );
  }

  const customer = await Customer.create({
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    address,
    emergencyContact,
    status: USER_STATUS.ACTIVE
  });

  logger.info(`New customer created: ${customer.id} by admin: ${req.user.id}`);

  res.status(HTTP_STATUS.CREATED).json(
    formatResponse(customer, 'Customer created successfully')
  );
});

/**
 * Update customer
 */
const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const customer = await Customer.findByPk(id);
  if (!customer) {
    throw new AppError(
      'Customer not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  // If email is being updated, check for duplicates
  if (updateData.email && updateData.email !== customer.email) {
    const existingCustomer = await Customer.findOne({ 
      where: { 
        email: updateData.email,
        id: { [Op.ne]: id }
      } 
    });
    
    if (existingCustomer) {
      throw new AppError(
        'Customer with this email already exists',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.DUPLICATE_RESOURCE
      );
    }
  }

  await customer.update(updateData);

  logger.info(`Customer updated: ${customer.id} by user: ${req.user.id}`);

  res.json(formatResponse(customer, 'Customer updated successfully'));
});

/**
 * Delete customer (soft delete)
 */
const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const customer = await Customer.findByPk(id);
  if (!customer) {
    throw new AppError(
      'Customer not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  await customer.update({ status: USER_STATUS.INACTIVE });

  logger.info(`Customer soft deleted: ${customer.id} by admin: ${req.user.id}`);

  res.json(formatResponse(null, 'Customer deleted successfully'));
});

/**
 * Get customer statistics
 */
const getCustomerStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const customer = await Customer.findByPk(id);
  if (!customer) {
    throw new AppError(
      'Customer not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  const stats = {
    totalOrders: await Order.count({ where: { customerId: id } }),
    totalSpent: await Order.sum('totalAmount', { where: { customerId: id, status: 'completed' } }) || 0,
    averageOrderValue: 0,
    lastOrderDate: await Order.max('createdAt', { where: { customerId: id } }),
    loyaltyPoints: customer.loyaltyPoints
  };

  if (stats.totalOrders > 0) {
    stats.averageOrderValue = stats.totalSpent / stats.totalOrders;
  }

  res.json(formatResponse(stats, 'Customer statistics retrieved successfully'));
});

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats
};
