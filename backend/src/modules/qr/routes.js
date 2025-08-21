const express = require('express');
const QRCode = require('qrcode');
const { prisma } = require('../../db/prisma');
const { authGuard } = require('../../middlewares/authGuard');
const { rbacGuard } = require('../../middlewares/rbacGuard');
const { zodValidate } = require('../../middlewares/zodValidate');
const { logger } = require('../../config/logger');
const { generateRandomToken } = require('../../utils/crypto');
const { SocketEmitter } = require('../../sockets/emitters');
const { z } = require('zod');

const router = express.Router();

// Schemas
const verifyQRSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    context: z.enum(['pickup', 'deliver', 'track']).optional()
  })
});

const generateQRSchema = z.object({
  body: z.object({
    orderId: z.string().optional(),
    deliveryId: z.string().optional(),
    context: z.enum(['pickup', 'deliver', 'track']),
    expiresInHours: z.number().min(1).max(168).optional() // 1 hour to 7 days
  })
});

// Generate QR code for order or delivery
router.post('/generate',
  authGuard,
  rbacGuard(['ADMIN', 'STAFF']),
  zodValidate(generateQRSchema),
  async (req, res, next) => {
    try {
      const { orderId, deliveryId, context, expiresInHours = 24 } = req.body;

      if (!orderId && !deliveryId) {
        return res.status(400).json({
          error: {
            code: 'MISSING_REFERENCE',
            message: 'Either orderId or deliveryId is required'
          }
        });
      }

      // Verify the referenced entity exists
      if (orderId) {
        const order = await prisma.order.findUnique({
          where: { id: orderId }
        });
        
        if (!order) {
          return res.status(404).json({
            error: {
              code: 'ORDER_NOT_FOUND',
              message: 'Order not found'
            }
          });
        }
      }

      if (deliveryId) {
        const delivery = await prisma.delivery.findUnique({
          where: { id: deliveryId }
        });
        
        if (!delivery) {
          return res.status(404).json({
            error: {
              code: 'DELIVERY_NOT_FOUND',
              message: 'Delivery not found'
            }
          });
        }
      }

      // Generate unique token
      const token = generateRandomToken(32);
      
      // Set expiration
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      // Create QR token record
      const qrToken = await prisma.qRToken.create({
        data: {
          token,
          orderId,
          deliveryId,
          context,
          expiresAt
        }
      });

      // Generate QR code image
      const qrData = JSON.stringify({
        token,
        context,
        timestamp: Date.now()
      });

      const qrImageDataUrl = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      logger.info(`QR code generated for ${orderId ? 'order' : 'delivery'} ${orderId || deliveryId} by ${req.user.email}`);

      res.json({
        qrToken: {
          id: qrToken.id,
          token,
          context,
          expiresAt,
          qrImageDataUrl
        }
      });

    } catch (error) {
      logger.error('Generate QR error:', error);
      next(error);
    }
  }
);

// Verify QR code
router.post('/verify',
  zodValidate(verifyQRSchema),
  async (req, res, next) => {
    try {
      const { token, context } = req.body;

      // Find QR token
      const qrToken = await prisma.qRToken.findUnique({
        where: { token },
        include: {
          order: {
            include: { customer: true }
          },
          delivery: {
            include: { 
              order: { include: { customer: true } },
              assignedTo: true 
            }
          }
        }
      });

      if (!qrToken) {
        return res.status(404).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid QR token'
          }
        });
      }

      // Check expiration
      if (qrToken.expiresAt < new Date()) {
        return res.status(400).json({
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'QR token has expired'
          }
        });
      }

      // Check if already used for non-tracking contexts
      if (qrToken.isUsed && context !== 'track') {
        return res.status(400).json({
          error: {
            code: 'TOKEN_USED',
            message: 'QR token has already been used'
          }
        });
      }

      // Build response based on user authentication
      const isAuthenticated = req.user ? true : false;
      let responseData = {
        ok: true,
        type: qrToken.orderId ? 'order' : 'delivery',
        context: qrToken.context,
        timestamp: new Date().toISOString()
      };

      // Public access - limited information
      if (!isAuthenticated) {
        if (qrToken.order) {
          responseData.orderNumber = qrToken.order.orderNumber;
          responseData.status = qrToken.order.status;
        } else if (qrToken.delivery) {
          responseData.orderNumber = qrToken.delivery.order.orderNumber;
          responseData.deliveryStatus = qrToken.delivery.status;
          responseData.orderStatus = qrToken.delivery.order.status;
        }
        
        return res.json(responseData);
      }

      // Authenticated access - handle delivery actions
      if (context && qrToken.delivery && req.user.role === 'DELIVERY') {
        const delivery = qrToken.delivery;
        
        // Check if user is assigned to this delivery
        if (delivery.assignedToId !== req.user.id) {
          return res.status(403).json({
            error: {
              code: 'NOT_ASSIGNED',
              message: 'You are not assigned to this delivery'
            }
          });
        }

        let newStatus = null;
        let statusChanged = false;

        // Handle pickup context
        if (context === 'pickup' && delivery.status === 'ASSIGNED') {
          newStatus = 'PICKED_UP';
          statusChanged = true;
        }

        // Handle deliver context
        if (context === 'deliver' && ['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(delivery.status)) {
          newStatus = 'DELIVERED';
          statusChanged = true;
        }

        if (statusChanged && newStatus) {
          await prisma.$transaction(async (tx) => {
            // Update delivery status
            await tx.delivery.update({
              where: { id: delivery.id },
              data: { 
                status: newStatus,
                ...(newStatus === 'PICKED_UP' && { pickedUpAt: new Date() }),
                ...(newStatus === 'DELIVERED' && { deliveredAt: new Date() })
              }
            });

            // Create status event
            await tx.deliveryStatusEvent.create({
              data: {
                deliveryId: delivery.id,
                status: newStatus,
                notes: `Status changed via QR scan by ${req.user.name}`
              }
            });

            // Update order status if delivered
            if (newStatus === 'DELIVERED') {
              await tx.order.update({
                where: { id: delivery.orderId },
                data: { status: 'DELIVERED' }
              });

              await tx.orderStatusEvent.create({
                data: {
                  orderId: delivery.orderId,
                  status: 'DELIVERED',
                  notes: 'Delivered by delivery partner'
                }
              });
            }

            // Mark QR token as used
            await tx.qRToken.update({
              where: { id: qrToken.id },
              data: { isUsed: true }
            });
          });

          // Emit real-time events
          const io = req.app.get('io');
          if (io) {
            const emitter = new SocketEmitter(io);
            emitter.deliveryStatusChanged(delivery.id, newStatus, delivery.orderId, delivery.assignedToId);
            
            if (newStatus === 'DELIVERED') {
              emitter.orderStatusChanged(delivery.orderId, 'DELIVERED', delivery.order.customerId);
            }
          }

          responseData.statusChanged = true;
          responseData.newStatus = newStatus;
          responseData.message = `Status updated to ${newStatus}`;
        }
      }

      // Add detailed information for authenticated users
      if (qrToken.order) {
        responseData.order = {
          id: qrToken.order.id,
          orderNumber: qrToken.order.orderNumber,
          status: qrToken.order.status,
          customer: qrToken.order.customer.name
        };
      }

      if (qrToken.delivery) {
        responseData.delivery = {
          id: qrToken.delivery.id,
          status: qrToken.delivery.status,
          assignedTo: qrToken.delivery.assignedTo?.name,
          order: {
            orderNumber: qrToken.delivery.order.orderNumber,
            customer: qrToken.delivery.order.customer.name
          }
        };
      }

      logger.info(`QR token verified: ${token} by ${req.user?.email || 'anonymous'}`);
      res.json(responseData);

    } catch (error) {
      logger.error('Verify QR error:', error);
      next(error);
    }
  }
);

// Middleware to add user context to public routes
router.use((req, res, next) => {
  // Try to authenticate user but don't fail if not authenticated
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Add user context without requiring authentication
      req.userId = decoded.userId;
      req.userRole = decoded.role;
    } catch (error) {
      // Ignore auth errors for public access
    }
  }
  next();
});

module.exports = router;
