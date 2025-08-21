const express = require('express');
const { prisma } = require('../../db/prisma');
const { authGuard } = require('../../middlewares/authGuard');
const { rbacGuard } = require('../../middlewares/rbacGuard');
const { zodValidate } = require('../../middlewares/zodValidate');
const { logger } = require('../../config/logger');
const { generateOrderNumber } = require('../../utils/idempotency');
const { SocketEmitter } = require('../../sockets/emitters');
const { z } = require('zod');

const router = express.Router();

// Schemas
const createOrderSchema = z.object({
  body: z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
    items: z.array(z.object({
      productId: z.string().min(1, 'Product ID is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      price: z.number().min(0, 'Price must be non-negative')
    })).min(1, 'At least one item is required'),
    notes: z.string().optional()
  })
});

const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_DISPATCH', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELED', 'RETURNED']),
    notes: z.string().optional()
  })
});

// Create order with inventory management
router.post('/',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF', 'CUSTOMER']),
  zodValidate(createOrderSchema),
  async (req, res, next) => {
    try {
      const { customerId, items, notes } = req.body;
      
      // For customers, they can only create orders for themselves
      if (req.user.role === 'CUSTOMER' && customerId !== req.user.id) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot create orders for other customers'
          }
        });
      }

      // Verify customer exists
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer) {
        return res.status(404).json({
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found'
          }
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Check product availability and calculate total
        let totalAmount = 0;
        const productChecks = [];

        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });

          if (!product || !product.isActive) {
            throw new Error(`Product ${item.productId} not found or inactive`);
          }

          const availableStock = product.onHand - product.reserved;
          if (availableStock < item.quantity) {
            throw new Error(`Insufficient stock for product ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`);
          }

          totalAmount += item.price * item.quantity;
          productChecks.push({ product, requestedQty: item.quantity });
        }

        // Create order
        const orderNumber = generateOrderNumber();
        const order = await tx.order.create({
          data: {
            orderNumber,
            customerId,
            status: 'PENDING',
            totalAmount,
            notes,
            items: {
              create: items
            }
          },
          include: {
            items: {
              include: { product: true }
            },
            customer: true
          }
        });

        // Reserve inventory
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          await tx.product.update({
            where: { id: item.productId },
            data: {
              reserved: {
                increment: item.quantity
              }
            }
          });

          // Create stock movement record
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'RESERVED',
              quantity: item.quantity,
              reference: orderNumber,
              notes: 'Order created - inventory reserved'
            }
          });
        }

        // Create initial status event
        await tx.orderStatusEvent.create({
          data: {
            orderId: order.id,
            status: 'CONFIRMED',
            notes: 'Order confirmed and inventory reserved'
          }
        });

        // Update order status to CONFIRMED
        const confirmedOrder = await tx.order.update({
          where: { id: order.id },
          data: { status: 'CONFIRMED' },
          include: {
            items: {
              include: { product: true }
            },
            customer: true
          }
        });

        // Create a preparation task
        await tx.task.create({
          data: {
            title: `Prepare Order ${orderNumber}`,
            description: `Prepare items for order ${orderNumber}`,
            type: 'PREPARE_ORDER',
            createdById: req.user.id
          }
        });

        return confirmedOrder;
      });

      // Emit real-time event
      const io = req.app.get('io');
      if (io) {
        const emitter = new SocketEmitter(io);
        emitter.orderStatusChanged(result.id, 'CONFIRMED', customerId);
      }

      logger.info(`Order created: ${result.orderNumber} by ${req.user.email}`);
      res.status(201).json({ order: result });

    } catch (error) {
      logger.error('Create order error:', error);
      
      if (error.message.includes('not found') || error.message.includes('inactive')) {
        return res.status(404).json({
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: error.message
          }
        });
      }
      
      if (error.message.includes('Insufficient stock')) {
        return res.status(400).json({
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: error.message
          }
        });
      }
      
      next(error);
    }
  }
);

// Get orders with filtering
router.get('/',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF', 'CUSTOMER']),
  async (req, res, next) => {
    try {
      const { status, customerId, dateFrom, dateTo, page = 1, pageSize = 10 } = req.query;
      const skip = (page - 1) * pageSize;
      
      const where = {};
      
      // Role-based filtering
      if (req.user.role === 'CUSTOMER') {
        where.customerId = req.user.id;
      } else if (customerId) {
        where.customerId = customerId;
      }
      
      if (status) {
        where.status = status;
      }
      
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            customer: true,
            items: {
              include: { product: true }
            },
            delivery: true,
            _count: {
              select: { statusEvents: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize
        }),
        prisma.order.count({ where })
      ]);

      res.json({
        orders,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      });

    } catch (error) {
      logger.error('Get orders error:', error);
      next(error);
    }
  }
);

// Get order by ID
router.get('/:id',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF', 'CUSTOMER']),
  async (req, res, next) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
          customer: true,
          items: {
            include: { product: true }
          },
          delivery: true,
          statusEvents: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!order) {
        return res.status(404).json({
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found'
          }
        });
      }

      // Check if customer can access this order
      if (req.user.role === 'CUSTOMER' && order.customerId !== req.user.id) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied to this order'
          }
        });
      }

      res.json({ order });

    } catch (error) {
      logger.error('Get order error:', error);
      next(error);
    }
  }
);

// Update order status
router.patch('/:id/status',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF']),
  zodValidate(updateOrderStatusSchema),
  async (req, res, next) => {
    try {
      const { status, notes } = req.body;

      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
          items: {
            include: { product: true }
          },
          customer: true
        }
      });

      if (!order) {
        return res.status(404).json({
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found'
          }
        });
      }

      // Status transition logic
      const validTransitions = {
        'PENDING': ['CONFIRMED', 'CANCELED'],
        'CONFIRMED': ['PREPARING', 'CANCELED'],
        'PREPARING': ['READY_FOR_DISPATCH', 'CANCELED'],
        'READY_FOR_DISPATCH': ['OUT_FOR_DELIVERY'],
        'OUT_FOR_DELIVERY': ['DELIVERED'],
        'DELIVERED': ['RETURNED'],
        'CANCELED': [],
        'RETURNED': []
      };

      if (!validTransitions[order.status]?.includes(status)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: `Cannot transition from ${order.status} to ${status}`
          }
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Handle inventory changes based on status
        if (status === 'READY_FOR_DISPATCH' && order.status === 'PREPARING') {
          // Move inventory from reserved to actually consumed
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                onHand: { decrement: item.quantity },
                reserved: { decrement: item.quantity }
              }
            });

            // Create stock movement
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: 'OUT',
                quantity: item.quantity,
                reference: order.orderNumber,
                notes: 'Order ready for dispatch'
              }
            });
          }
        } else if (status === 'CANCELED' && ['CONFIRMED', 'PREPARING'].includes(order.status)) {
          // Release reserved inventory
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                reserved: { decrement: item.quantity }
              }
            });

            // Create stock movement
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: 'RELEASED',
                quantity: item.quantity,
                reference: order.orderNumber,
                notes: 'Order canceled - inventory released'
              }
            });
          }
        }

        // Create status event
        await tx.orderStatusEvent.create({
          data: {
            orderId: order.id,
            status,
            notes
          }
        });

        // Update order
        return await tx.order.update({
          where: { id: req.params.id },
          data: { status },
          include: {
            customer: true,
            items: {
              include: { product: true }
            },
            delivery: true,
            statusEvents: {
              orderBy: { createdAt: 'desc' }
            }
          }
        });
      });

      // Emit real-time event
      const io = req.app.get('io');
      if (io) {
        const emitter = new SocketEmitter(io);
        emitter.orderStatusChanged(result.id, status, result.customerId);
      }

      logger.info(`Order status updated: ${order.orderNumber} to ${status} by ${req.user.email}`);
      res.json({ order: result });

    } catch (error) {
      logger.error('Update order status error:', error);
      next(error);
    }
  }
);

module.exports = router;
