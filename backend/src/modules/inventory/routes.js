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

module.exports = router;
