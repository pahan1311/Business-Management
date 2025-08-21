const QRCode = require('qrcode');
const { prisma } = require('../../db/prisma');
const { logger } = require('../../config/logger');
const { generateRandomToken } = require('../../utils/crypto');
const { SocketEmitter } = require('../../sockets/emitters');

class QRCodeService {
  constructor() {
    this.socketEmitter = new SocketEmitter();
  }

  async generateQRToken(data) {
    const { orderId, deliveryId, context, expiresInHours = 24 } = data;
    
    if (!orderId && !deliveryId) {
      throw new Error('Either orderId or deliveryId is required');
    }
    
    try {
      // Generate a random token
      const token = generateRandomToken(32);
      
      // Set expiry date (default to 24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);
      
      // Create QR token in database
      const qrToken = await prisma.qRToken.create({
        data: {
          token,
          orderId,
          deliveryId,
          context,
          expiresAt,
          isUsed: false
        }
      });
      
      // Generate the QR code data URL
      const qrData = JSON.stringify({
        token: qrToken.token,
        type: 'cidms',
        context,
        timestamp: new Date().toISOString()
      });
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300
      });
      
      return {
        token: qrToken.token,
        qrCodeDataUrl,
        expiresAt: qrToken.expiresAt
      };
    } catch (error) {
      logger.error('Error generating QR code:', error);
      throw error;
    }
  }

  async verifyQRToken(tokenData) {
    const { token, context } = tokenData;
    
    try {
      // Find the token in the database
      const qrToken = await prisma.qRToken.findUnique({
        where: { token },
        include: {
          order: {
            include: {
              customer: true,
              items: {
                include: {
                  product: true
                }
              }
            }
          },
          delivery: {
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              order: {
                include: {
                  customer: true
                }
              }
            }
          }
        }
      });
      
      if (!qrToken) {
        throw new Error('QR token not found');
      }
      
      // Check if token has expired
      if (new Date() > qrToken.expiresAt) {
        throw new Error('QR token has expired');
      }
      
      // If context is specified, check that it matches
      if (context && qrToken.context !== context) {
        throw new Error(`Invalid context: Expected ${qrToken.context}, got ${context}`);
      }
      
      // Mark token as used
      const updatedToken = await prisma.qRToken.update({
        where: { id: qrToken.id },
        data: { isUsed: true }
      });
      
      // Prepare response data
      const responseData = {
        valid: true,
        context: qrToken.context,
        tokenId: qrToken.id
      };
      
      // Add order data if available
      if (qrToken.order) {
        responseData.order = {
          id: qrToken.order.id,
          orderNumber: qrToken.order.orderNumber,
          status: qrToken.order.status,
          createdAt: qrToken.order.createdAt,
          customer: {
            name: qrToken.order.customer.name,
            email: qrToken.order.customer.email,
            phone: qrToken.order.customer.phone
          },
          items: qrToken.order.items.map(item => ({
            product: item.product.name,
            quantity: item.quantity,
            price: item.price
          }))
        };
      }
      
      // Add delivery data if available
      if (qrToken.delivery) {
        responseData.delivery = {
          id: qrToken.delivery.id,
          status: qrToken.delivery.status,
          pickupAddress: qrToken.delivery.pickupAddress,
          deliveryAddress: qrToken.delivery.deliveryAddress,
          scheduledAt: qrToken.delivery.scheduledAt,
          order: qrToken.delivery.order ? {
            orderNumber: qrToken.delivery.order.orderNumber,
            customer: {
              name: qrToken.delivery.order.customer.name,
              phone: qrToken.delivery.order.customer.phone
            }
          } : null
        };
        
        if (qrToken.delivery.assignedTo) {
          responseData.delivery.assignedTo = {
            name: qrToken.delivery.assignedTo.name,
            phone: qrToken.delivery.assignedTo.phone
          };
        }
      }

      // Emit socket event
      if (qrToken.order) {
        this.socketEmitter.emitToAdmins('qr:scanned', {
          tokenId: qrToken.id,
          orderId: qrToken.order.id,
          context: qrToken.context
        });
      }
      
      return responseData;
    } catch (error) {
      logger.error('Error verifying QR code:', error);
      throw error;
    }
  }

  async getQRTokensForOrder(orderId) {
    try {
      const tokens = await prisma.qRToken.findMany({
        where: { 
          orderId,
          expiresAt: {
            gt: new Date() // Only return non-expired tokens
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return tokens;
    } catch (error) {
      logger.error(`Error getting QR tokens for order ${orderId}:`, error);
      throw error;
    }
  }

  async getQRTokensForDelivery(deliveryId) {
    try {
      const tokens = await prisma.qRToken.findMany({
        where: { 
          deliveryId,
          expiresAt: {
            gt: new Date() // Only return non-expired tokens
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return tokens;
    } catch (error) {
      logger.error(`Error getting QR tokens for delivery ${deliveryId}:`, error);
      throw error;
    }
  }

  async regenerateQRCode(tokenId) {
    try {
      const oldToken = await prisma.qRToken.findUnique({
        where: { id: tokenId }
      });
      
      if (!oldToken) {
        throw new Error('QR token not found');
      }
      
      // Create new token with same properties
      const result = await this.generateQRToken({
        orderId: oldToken.orderId,
        deliveryId: oldToken.deliveryId,
        context: oldToken.context
      });
      
      // Invalidate old token
      await prisma.qRToken.update({
        where: { id: tokenId },
        data: { expiresAt: new Date() } // Expire immediately
      });
      
      return result;
    } catch (error) {
      logger.error(`Error regenerating QR code for token ${tokenId}:`, error);
      throw error;
    }
  }
}

module.exports = { QRCodeService };
