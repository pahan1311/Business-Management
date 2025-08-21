const { prisma } = require('../../db/prisma');
const { logger } = require('../../config/logger');
const { SocketEmitter } = require('../../sockets/emitters');

class InventoryService {
  constructor() {
    this.socketEmitter = new SocketEmitter();
  }

  async checkLowStockLevels() {
    try {
      // Find all products where stock level is at or below reorder point
      const lowStockProducts = await prisma.product.findMany({
        where: {
          onHand: {
            lte: prisma.product.reorderPoint
          },
          isActive: true
        }
      });

      if (lowStockProducts.length > 0) {
        // Emit socket event for low stock
        this.socketEmitter.emitToAdmins('inventory:low-stock', {
          products: lowStockProducts.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            onHand: p.onHand,
            reorderPoint: p.reorderPoint
          }))
        });

        logger.info(`Low stock alert triggered for ${lowStockProducts.length} products`);
      }

      return lowStockProducts;
    } catch (error) {
      logger.error('Error checking low stock levels:', error);
      throw error;
    }
  }

  async updateProductStock(productId, movement) {
    const { type, quantity, reference, notes } = movement;

    try {
      // Start a transaction
      return await prisma.$transaction(async (tx) => {
        // Get current product
        const product = await tx.product.findUnique({
          where: { id: productId }
        });

        if (!product) {
          throw new Error('Product not found');
        }

        // Calculate new stock levels based on movement type
        let newOnHand = product.onHand;
        let newReserved = product.reserved;

        switch (type) {
          case 'IN':
            newOnHand += quantity;
            break;
          case 'OUT':
            if (product.onHand < quantity) {
              throw new Error('Insufficient stock');
            }
            newOnHand -= quantity;
            break;
          case 'RESERVED':
            if (product.onHand < quantity) {
              throw new Error('Insufficient stock to reserve');
            }
            newOnHand -= quantity;
            newReserved += quantity;
            break;
          case 'RELEASED':
            if (product.reserved < quantity) {
              throw new Error('Insufficient reserved stock to release');
            }
            newOnHand += quantity;
            newReserved -= quantity;
            break;
          case 'ADJUSTMENT':
            newOnHand = quantity; // Direct set to the new value
            break;
          default:
            throw new Error('Invalid movement type');
        }

        // Update product
        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: {
            onHand: newOnHand,
            reserved: newReserved
          }
        });

        // Record stock movement
        await tx.stockMovement.create({
          data: {
            productId,
            type,
            quantity,
            reference,
            notes
          }
        });

        // Check if stock is low after update
        if (updatedProduct.onHand <= updatedProduct.reorderPoint) {
          // Emit low stock event
          this.socketEmitter.emitToAdmins('inventory:low-stock-item', {
            product: {
              id: updatedProduct.id,
              name: updatedProduct.name,
              sku: updatedProduct.sku,
              onHand: updatedProduct.onHand,
              reorderPoint: updatedProduct.reorderPoint
            }
          });
        }

        return updatedProduct;
      });
    } catch (error) {
      logger.error(`Error updating product stock for ${productId}:`, error);
      throw error;
    }
  }

  async getStockMovements(productId, filters = {}) {
    const { startDate, endDate, type, page = 1, pageSize = 10 } = filters;
    const skip = (page - 1) * pageSize;

    try {
      const where = {};
      
      if (productId) {
        where.productId = productId;
      }

      if (type) {
        where.type = type;
      }

      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const [movements, total] = await Promise.all([
        prisma.stockMovement.findMany({
          where,
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: pageSize
        }),
        prisma.stockMovement.count({ where })
      ]);

      return {
        movements,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      logger.error('Error getting stock movements:', error);
      throw error;
    }
  }
}

module.exports = { InventoryService };
