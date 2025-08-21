const express = require('express');
const { prisma } = require('../../db/prisma');
const { authGuard } = require('../../middlewares/authGuard');
const { rbacGuard } = require('../../middlewares/rbacGuard');
const { logger } = require('../../config/logger');

const router = express.Router();

// Get deliveries
router.get('/',
  authGuard,
  rbacGuard(['ADMIN', 'DELIVERY']),
  async (req, res, next) => {
    try {
      const { status, assignedTo, page = 1, pageSize = 10 } = req.query;
      const skip = (page - 1) * pageSize;
      
      const where = {};
      if (status) where.status = status;
      if (assignedTo) where.assignedToId = assignedTo;
      
      // Delivery users can only see their own deliveries
      if (req.user.role === 'DELIVERY') {
        where.assignedToId = req.user.id;
      }

      const [deliveries, total] = await Promise.all([
        prisma.delivery.findMany({
          where,
          include: {
            order: { include: { customer: true } },
            assignedTo: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize
        }),
        prisma.delivery.count({ where })
      ]);

      res.json({
        deliveries,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      logger.error('Get deliveries error:', error);
      next(error);
    }
  }
);

// Create delivery
router.post('/',
  authGuard,
  rbacGuard(['ADMIN']),
  async (req, res, next) => {
    try {
      const { orderId, assignedToId, pickupAddress, deliveryAddress, scheduledAt } = req.body;

      const delivery = await prisma.delivery.create({
        data: {
          orderId,
          assignedToId,
          pickupAddress,
          deliveryAddress,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null
        },
        include: {
          order: { include: { customer: true } },
          assignedTo: true
        }
      });

      // Create initial status event
      await prisma.deliveryStatusEvent.create({
        data: {
          deliveryId: delivery.id,
          status: 'ASSIGNED',
          notes: 'Delivery created and assigned'
        }
      });

      logger.info(`Delivery created for order ${delivery.order.orderNumber} by ${req.user.email}`);
      res.status(201).json({ delivery });
    } catch (error) {
      logger.error('Create delivery error:', error);
      next(error);
    }
  }
);

// Update delivery status
router.patch('/:id/status',
  authGuard,
  rbacGuard(['ADMIN', 'DELIVERY']),
  async (req, res, next) => {
    try {
      const { status, notes, location } = req.body;

      const delivery = await prisma.delivery.findUnique({
        where: { id: req.params.id },
        include: { assignedTo: true }
      });

      if (!delivery) {
        return res.status(404).json({
          error: { code: 'DELIVERY_NOT_FOUND', message: 'Delivery not found' }
        });
      }

      // Check if delivery user is assigned
      if (req.user.role === 'DELIVERY' && delivery.assignedToId !== req.user.id) {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Not assigned to this delivery' }
        });
      }

      const updatedDelivery = await prisma.$transaction(async (tx) => {
        // Create status event
        await tx.deliveryStatusEvent.create({
          data: {
            deliveryId: delivery.id,
            status,
            notes,
            location
          }
        });

        // Update delivery
        return await tx.delivery.update({
          where: { id: req.params.id },
          data: { 
            status,
            ...(status === 'PICKED_UP' && { pickedUpAt: new Date() }),
            ...(status === 'DELIVERED' && { deliveredAt: new Date() })
          },
          include: {
            order: { include: { customer: true } },
            assignedTo: true,
            statusEvents: { orderBy: { createdAt: 'desc' } }
          }
        });
      });

      res.json({ delivery: updatedDelivery });
    } catch (error) {
      logger.error('Update delivery status error:', error);
      next(error);
    }
  }
);

module.exports = router;
