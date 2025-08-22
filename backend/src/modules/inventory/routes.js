const express = require('express');
const { prisma } = require('../../db/prisma');
const { authGuard } = require('../../middlewares/authGuard');
const { rbacGuard } = require('../../middlewares/rbacGuard');
const { logger } = require('../../config/logger');

const router = express.Router();

// Get all products
router.get('/',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF']),
  async (req, res, next) => {
    try {
      const { search, page = 1, pageSize = 10 } = req.query;
      const skip = (page - 1) * pageSize;
      
      const where = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: { name: 'asc' },
          skip,
          take: pageSize
        }),
        prisma.product.count({ where })
      ]);

      res.json({
        products,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      logger.error('Get products error:', error);
      next(error);
    }
  }
);

// Get low stock products
router.get('/low-stock',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF']),
  async (req, res, next) => {
    try {
      const products = await prisma.product.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                { onHand: { lte: prisma.product.fields.reorderPoint } }
              ]
            }
          ]
        },
        orderBy: { onHand: 'asc' }
      });

      res.json({ products });
    } catch (error) {
      logger.error('Get low stock error:', error);
      next(error);
    }
  }
);

// Create product
router.post('/',
  authGuard,
  rbacGuard(['ADMIN']),
  async (req, res, next) => {
    try {
      const product = await prisma.product.create({
        data: req.body
      });

      logger.info(`Product created: ${product.name} by ${req.user.email}`);
      res.status(201).json({ product });
    } catch (error) {
      logger.error('Create product error:', error);
      next(error);
    }
  }
);

// Get stock movements
router.get('/movements',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF']),
  async (req, res, next) => {
    try {
      const { productId, type, dateFrom, dateTo, page = 1, pageSize = 20 } = req.query;
      const skip = (page - 1) * pageSize;
      
      const where = {};
      if (productId) where.productId = productId;
      if (type) where.type = type;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const [movements, total] = await Promise.all([
        prisma.stockMovement.findMany({
          where,
          include: { product: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize
        }),
        prisma.stockMovement.count({ where })
      ]);

      res.json({
        movements,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      logger.error('Get stock movements error:', error);
      next(error);
    }
  }
);

// Update product stock
router.post('/products/:id/stock',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF']),
  async (req, res, next) => {
    try {
      const { type, quantity, reference, notes } = req.body;
      const productId = req.params.id;

      // Validate input
      if (!['IN', 'OUT'].includes(type)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_MOVEMENT_TYPE',
            message: 'Movement type must be IN or OUT'
          }
        });
      }

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          error: {
            code: 'INVALID_QUANTITY',
            message: 'Quantity must be a positive number'
          }
        });
      }

      // Get current product
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return res.status(404).json({
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found'
          }
        });
      }

      // Check if we have enough stock for outbound movement
      if (type === 'OUT' && product.onHand < quantity) {
        return res.status(400).json({
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `Insufficient stock. Available: ${product.onHand}, Requested: ${quantity}`
          }
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Calculate new stock level
        const newStock = type === 'IN' 
          ? product.onHand + quantity 
          : product.onHand - quantity;

        // Update product stock
        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: { onHand: newStock }
        });

        // Create stock movement record
        const movement = await tx.stockMovement.create({
          data: {
            productId: productId,
            type: type,
            quantity: quantity,
            reference: reference || null,
            notes: notes || `Stock ${type.toLowerCase()} by ${req.user.email}`,
            userId: req.user.userId
          }
        });

        return { product: updatedProduct, movement };
      });

      logger.info(`Stock updated: ${product.name} ${type} ${quantity} by ${req.user.email}`);
      
      res.json({
        message: 'Stock updated successfully',
        product: result.product,
        movement: result.movement
      });

    } catch (error) {
      logger.error('Update stock error:', error);
      next(error);
    }
  }
);

// Get inventory alerts (low stock, out of stock)
router.get('/alerts',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF']),
  async (req, res, next) => {
    try {
      const [lowStock, outOfStock] = await Promise.all([
        // Low stock products (at or below reorder level)
        prisma.product.findMany({
          where: {
            isActive: true,
            onHand: { lte: prisma.product.fields.reorderPoint },
            onHand: { gt: 0 }
          },
          orderBy: { onHand: 'asc' }
        }),
        // Out of stock products
        prisma.product.findMany({
          where: {
            isActive: true,
            onHand: 0
          },
          orderBy: { name: 'asc' }
        })
      ]);

      res.json({
        lowStock,
        outOfStock,
        totalAlerts: lowStock.length + outOfStock.length
      });

    } catch (error) {
      logger.error('Get inventory alerts error:', error);
      next(error);
    }
  }
);

module.exports = router;
