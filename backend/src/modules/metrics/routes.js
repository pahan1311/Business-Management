const express = require('express');
const { prisma } = require('../../db/prisma');
const { authGuard } = require('../../middlewares/authGuard');
const { rbacGuard } = require('../../middlewares/rbacGuard');
const { logger } = require('../../config/logger');

const router = express.Router();

// Get dashboard metrics
router.get('/dashboard',
  authGuard,
  rbacGuard(['ADMIN']),
  async (req, res, next) => {
    try {
      const [
        totalOrders,
        totalCustomers,
        activeDeliveries,
        pendingTasks,
        lowStockProducts,
        recentOrders,
        ordersByStatus,
        deliveriesByStatus
      ] = await Promise.all([
        prisma.order.count(),
        prisma.customer.count({ where: { isActive: true } }),
        prisma.delivery.count({ where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] } } }),
        prisma.task.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
        prisma.product.count({
          where: {
            AND: [
              { isActive: true },
              { onHand: { lte: prisma.product.fields.reorderPoint } }
            ]
          }
        }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { customer: true }
        }),
        prisma.order.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        prisma.delivery.groupBy({
          by: ['status'],
          _count: { status: true }
        })
      ]);

      res.json({
        overview: {
          totalOrders,
          totalCustomers,
          activeDeliveries,
          pendingTasks,
          lowStockProducts
        },
        recentOrders,
        charts: {
          ordersByStatus,
          deliveriesByStatus
        }
      });
    } catch (error) {
      logger.error('Get dashboard metrics error:', error);
      next(error);
    }
  }
);

// Get sales report
router.get('/sales',
  authGuard,
  rbacGuard(['ADMIN']),
  async (req, res, next) => {
    try {
      const { dateFrom, dateTo } = req.query;
      
      const where = {};
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const [orders, totalRevenue] = await Promise.all([
        prisma.order.findMany({
          where: { ...where, status: 'DELIVERED' },
          include: { customer: true },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.order.aggregate({
          where: { ...where, status: 'DELIVERED' },
          _sum: { totalAmount: true }
        })
      ]);

      res.json({
        orders,
        summary: {
          totalOrders: orders.length,
          totalRevenue: totalRevenue._sum.totalAmount || 0
        }
      });
    } catch (error) {
      logger.error('Get sales report error:', error);
      next(error);
    }
  }
);

// Get inventory report
router.get('/inventory',
  authGuard,
  rbacGuard(['ADMIN']),
  async (req, res, next) => {
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });

      const lowStock = products.filter(p => p.onHand <= p.reorderPoint);
      const totalValue = products.reduce((sum, p) => sum + (p.onHand * p.price), 0);

      res.json({
        products,
        summary: {
          totalProducts: products.length,
          lowStockCount: lowStock.length,
          totalValue
        }
      });
    } catch (error) {
      logger.error('Get inventory report error:', error);
      next(error);
    }
  }
);

module.exports = router;
