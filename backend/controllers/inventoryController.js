/**
 * Inventory Controller
 */

const { Product, Inventory } = require('../models');
const { Op } = require('sequelize');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES, RESPONSE_MESSAGES } = require('../utils/constants');
const { formatResponse, getPaginationData } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get all products
 */
const getAllProducts = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    category, 
    status,
    lowStock = false,
    sortBy = 'createdAt', 
    sortOrder = 'DESC' 
  } = req.query;
  
  const where = {};
  
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
      { sku: { [Op.like]: `%${search}%` } }
    ];
  }
  
  if (category) where.category = category;
  if (status) where.status = status;
  
  if (lowStock === 'true') {
    where[Op.and] = [
      { stock: { [Op.lte]: { [Op.col]: 'minStockLevel' } } }
    ];
  }

  const offset = (page - 1) * limit;
  
  const { count, rows: products } = await Product.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder.toUpperCase()]],
    distinct: true
  });

  const pagination = getPaginationData(count, page, limit);

  res.json(formatResponse({
    products,
    pagination
  }, 'Products retrieved successfully'));
});

/**
 * Get product by ID
 */
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const product = await Product.findByPk(id);

  if (!product) {
    throw new AppError(
      'Product not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  res.json(formatResponse(product, 'Product retrieved successfully'));
});

/**
 * Create new product
 */
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    sku,
    category,
    price,
    stock,
    minStockLevel,
    maxStockLevel,
    unit,
    status = 'active'
  } = req.body;

  // Check if SKU already exists
  const existingProduct = await Product.findOne({ where: { sku } });
  if (existingProduct) {
    throw new AppError(
      'Product with this SKU already exists',
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.DUPLICATE_RESOURCE
    );
  }

  const product = await Product.create({
    name,
    description,
    sku,
    category,
    price,
    stock,
    minStockLevel,
    maxStockLevel,
    unit,
    status
  });

  logger.info(`New product created: ${product.id} (SKU: ${sku}) by user: ${req.user.id}`);

  res.status(HTTP_STATUS.CREATED).json(
    formatResponse(product, 'Product created successfully')
  );
});

/**
 * Update product
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const product = await Product.findByPk(id);
  if (!product) {
    throw new AppError(
      'Product not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  // If SKU is being updated, check for duplicates
  if (updateData.sku && updateData.sku !== product.sku) {
    const existingProduct = await Product.findOne({ 
      where: { 
        sku: updateData.sku,
        id: { [Op.ne]: id }
      } 
    });
    
    if (existingProduct) {
      throw new AppError(
        'Product with this SKU already exists',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.DUPLICATE_RESOURCE
      );
    }
  }

  await product.update(updateData);

  logger.info(`Product updated: ${product.id} by user: ${req.user.id}`);

  res.json(formatResponse(product, 'Product updated successfully'));
});

/**
 * Delete product
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const product = await Product.findByPk(id);
  if (!product) {
    throw new AppError(
      'Product not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  await product.update({ status: 'inactive' });

  logger.info(`Product soft deleted: ${product.id} by user: ${req.user.id}`);

  res.json(formatResponse(null, 'Product deleted successfully'));
});

/**
 * Update product stock
 */
const updateStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, type, reason } = req.body; // type: 'add' or 'subtract'
  
  const product = await Product.findByPk(id);
  if (!product) {
    throw new AppError(
      'Product not found',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );
  }

  const oldStock = product.stock;
  let newStock;

  if (type === 'add') {
    newStock = oldStock + quantity;
  } else if (type === 'subtract') {
    if (oldStock < quantity) {
      throw new AppError(
        'Insufficient stock for this operation',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INSUFFICIENT_STOCK
      );
    }
    newStock = oldStock - quantity;
  } else {
    throw new AppError(
      'Invalid stock operation type',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_INPUT
    );
  }

  await product.update({ stock: newStock });

  // Log inventory movement
  await Inventory.create({
    productId: id,
    type,
    quantity,
    previousStock: oldStock,
    newStock,
    reason,
    userId: req.user.id
  });

  logger.info(`Stock updated for product ${product.id}: ${oldStock} -> ${newStock}`);

  res.json(formatResponse({
    product,
    stockMovement: {
      oldStock,
      newStock,
      quantity,
      type
    }
  }, 'Stock updated successfully'));
});

/**
 * Get inventory movements
 */
const getInventoryMovements = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    productId, 
    type, 
    dateFrom, 
    dateTo,
    sortBy = 'createdAt', 
    sortOrder = 'DESC' 
  } = req.query;
  
  const where = {};
  if (productId) where.productId = productId;
  if (type) where.type = type;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
    if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
  }

  const offset = (page - 1) * limit;
  
  const { count, rows: movements } = await Inventory.findAndCountAll({
    where,
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['name', 'sku']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder.toUpperCase()]],
    distinct: true
  });

  const pagination = getPaginationData(count, page, limit);

  res.json(formatResponse({
    movements,
    pagination
  }, 'Inventory movements retrieved successfully'));
});

/**
 * Get low stock products
 */
const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.findAll({
    where: {
      [Op.and]: [
        { stock: { [Op.lte]: { [Op.col]: 'minStockLevel' } } },
        { status: 'active' }
      ]
    },
    order: [['stock', 'ASC']]
  });

  res.json(formatResponse(products, 'Low stock products retrieved successfully'));
});

/**
 * Get inventory statistics
 */
const getInventoryStats = asyncHandler(async (req, res) => {
  const stats = {
    totalProducts: await Product.count({ where: { status: 'active' } }),
    totalStock: await Product.sum('stock', { where: { status: 'active' } }) || 0,
    lowStockCount: await Product.count({
      where: {
        [Op.and]: [
          { stock: { [Op.lte]: { [Op.col]: 'minStockLevel' } } },
          { status: 'active' }
        ]
      }
    }),
    outOfStockCount: await Product.count({
      where: {
        stock: 0,
        status: 'active'
      }
    }),
    totalValue: 0
  };

  // Calculate total inventory value
  const products = await Product.findAll({
    where: { status: 'active' },
    attributes: ['stock', 'price']
  });

  stats.totalValue = products.reduce((total, product) => {
    return total + (product.stock * product.price);
  }, 0);

  res.json(formatResponse(stats, 'Inventory statistics retrieved successfully'));
});

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getInventoryMovements,
  getLowStockProducts,
  getInventoryStats
};
